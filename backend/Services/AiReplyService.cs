using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

public class AiReplyService
{
    private readonly HttpClient http;
    private readonly IConfiguration configuration;
    private readonly ILogger<AiReplyService> logger;

    public AiReplyService(HttpClient http, IConfiguration configuration, ILogger<AiReplyService> logger)
    {
        this.http = http;
        this.configuration = configuration;
        this.logger = logger;
    }

    public async Task<(string? Reply, string? Error)> GenerateReplyAsync(Ticket ticket, User customer, CancellationToken cancellationToken)
    {
        var apiKey = configuration["OPENROUTER_API_KEY"] ?? configuration["OpenRouter:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return (null, "OpenRouter API key is not configured.");
        }

        var model = configuration["OpenRouter:Model"] ?? "google/gemini-2.5-flash";
        var prompt = BuildPrompt(ticket, customer);

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Headers.TryAddWithoutValidation("HTTP-Referer", configuration["OpenRouter:SiteUrl"] ?? "http://localhost:4200");
        request.Headers.TryAddWithoutValidation("X-Title", configuration["OpenRouter:AppName"] ?? "AI Support Triage");

        request.Content = new StringContent(JsonSerializer.Serialize(new
        {
            model,
            messages = new[]
            {
                new { role = "system", content = "You write concise, empathetic customer support replies. Do not invent refunds, dates, or actions that are not in the ticket. Ask for missing details when needed." },
                new { role = "user", content = prompt }
            },
            temperature = 0.4,
            max_tokens = 220
        }), Encoding.UTF8, "application/json");

        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("OpenRouter reply generation failed with {StatusCode}: {Body}", response.StatusCode, raw);
                return (null, "AI reply generation failed. Check the OpenRouter key and model.");
            }

            using var document = JsonDocument.Parse(raw);
            var reply = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return (string.IsNullOrWhiteSpace(reply) ? null : reply.Trim(), null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "OpenRouter reply generation failed.");
            return (null, "AI reply generation is unavailable right now.");
        }
    }

    private static string BuildPrompt(Ticket ticket, User customer)
    {
        var category = ticket.CategoryId is null ? ticket.AiPredictedCategory : Store.Categories[ticket.CategoryId.Value].Name;

        return $"""
        Draft a reply to this customer support ticket.

        Customer name: {customer.FullName}
        Customer email: {customer.Email}
        Ticket title: {ticket.Title}
        Ticket description: {ticket.Description}
        Current status: {ticket.Status}
        Priority: {ticket.Priority ?? "Pending"}
        Category: {category ?? "Pending"}

        Requirements:
        - Keep it under 120 words.
        - Use a professional, reassuring tone.
        - Mention the issue briefly.
        - Do not promise a refund, fix, or timeline unless the ticket already confirms it.
        - End with one clear next step.
        """;
    }
}
