using Hangfire;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog replaces the default logger so requests and app events are written consistently.
builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// Read feature flags and shared settings from appsettings.json/environment variables.
AppFeatures.UseSqlServer = builder.Configuration.GetValue<bool>("Features:UseSqlServer");
AppFeatures.UseHangfire = builder.Configuration.GetValue<bool>("Features:UseHangfire");
AppFeatures.UploadPath = builder.Configuration.GetValue<string>("Storage:UploadPath") ?? "uploads";
AppFeatures.JwtSecret = builder.Configuration.GetValue<string>("Jwt:Secret") ?? AppFeatures.JwtSecret;
AppFeatures.JwtIssuer = builder.Configuration.GetValue<string>("Jwt:Issuer") ?? AppFeatures.JwtIssuer;
AppFeatures.JwtAudience = builder.Configuration.GetValue<string>("Jwt:Audience") ?? AppFeatures.JwtAudience;
AppFeatures.JwtExpiryHours = builder.Configuration.GetValue<int?>("Jwt:ExpiryHours") ?? 24;

// Ensure the upload folder exists before any file upload endpoint tries to use it.
Directory.CreateDirectory(AppFeatures.UploadPath);

var sqlServerConnection = builder.Configuration.GetConnectionString("SqlServer");
if (AppFeatures.UseSqlServer)
{
    // Register EF Core only when the SQL Server feature is enabled.
    builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(sqlServerConnection));
}

if (AppFeatures.UseHangfire)
{
    // Hangfire runs background jobs such as auto-closing tickets and model retraining.
    builder.Services.AddHangfire(options => options.UseSqlServerStorage(sqlServerConnection));
    builder.Services.AddHangfireServer();
}

// Register MVC controllers, cache, HTTP clients, validators, OpenAPI, Swagger, and CORS.
builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<AiReplyService>();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = Tokens.ValidationParameters();
    });
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.SetIsOriginAllowed(origin =>
            Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
            uri.Port == 4200 &&
            (uri.Host == "localhost" || uri.Host == "127.0.0.1" || uri.Host.StartsWith("192.168.") || uri.Host.StartsWith("172.") || uri.Host.StartsWith("10.")))
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Allow the Angular dev server to call this API.
app.UseCors("frontend");

// Log each HTTP request through Serilog.
app.UseSerilogRequestLogging();

// Standard ASP.NET authentication validates Bearer JWTs and attaches the principal to HttpContext.User.
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    // Development-only API documentation endpoints.
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AI Support Triage API v1");
        options.RoutePrefix = "swagger";
    });
}

if (AppFeatures.UseSqlServer)
{
    // Create and seed the database when SQL Server mode is active.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

// Lightweight health/info endpoint used to confirm the API is running.
app.MapGet("/", () => Results.Ok(new
{
    name = "AI Customer Support Triage Platform",
    api = "http://localhost:5000/api",
    openApi = "/openapi/v1.json"
}));

// Connect attribute-routed controllers such as AuthController.
app.MapControllers();

if (AppFeatures.UseHangfire)
{
    // Expose the Hangfire dashboard and schedule recurring maintenance jobs.
    app.UseHangfireDashboard("/hangfire");
    RecurringJob.AddOrUpdate("auto-close-resolved-tickets", () => AutoCloseJob.Execute(), Cron.Hourly);
    RecurringJob.AddOrUpdate("retrain-ml-models", () => RetrainModelsJob.Execute(), Cron.Monthly);
}

// Start the API on a fixed local URL used by the frontend.
app.Run("http://localhost:5000");
