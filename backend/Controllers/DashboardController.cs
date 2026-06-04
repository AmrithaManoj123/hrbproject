using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

[ApiController]
[Route("api/dashboard")]
public class DashboardController(IMemoryCache cache) : ControllerBase
{
    [HttpGet("stats")]
    public IActionResult Stats()
    {
        var currentUser = Auth.RequireAnyRole(HttpContext, Roles.Agent, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;

        var cacheKey = $"dashboard-stats:{currentUser.User!.Id}:{currentUser.User.Role}:{Store.Tickets.Count}";
        if (cache.TryGetValue(cacheKey, out object? cachedStats))
        {
            return Ok(cachedStats);
        }

        var tickets = Store.Tickets.Values.AsEnumerable();
        if (currentUser.User!.Role == Roles.Agent)
        {
            tickets = tickets.Where(ticket => ticket.AssignedAgentId == currentUser.User.Id);
        }

        var ticketList = tickets.ToList();
        var resolved = ticketList.Where(ticket => ticket.ResolvedAt is not null).ToList();
        var slaEligible = ticketList.Where(ticket => ticket.SlaDueAt is not null && ticket.ResolvedAt is not null).ToList();
        var slaMet = slaEligible.Count(ticket => ticket.ResolvedAt <= ticket.SlaDueAt);

        var stats = new
        {
            totalTickets = ticketList.Count,
            openTickets = ticketList.Count(ticket => TicketStatuses.Open.Contains(ticket.Status)),
            resolvedToday = resolved.Count(ticket => ticket.ResolvedAt?.Date == DateTimeOffset.UtcNow.Date),
            avgResolutionHours = resolved.Count == 0 ? 0 : Math.Round(resolved.Average(ticket => (ticket.ResolvedAt!.Value - ticket.CreatedAt).TotalHours), 2),
            slaCompliancePercent = slaEligible.Count == 0 ? 100 : Math.Round(slaMet * 100.0 / slaEligible.Count, 2),
            ticketsByCategory = Store.Categories.Values.ToDictionary(category => category.Name, category => ticketList.Count(ticket => ticket.CategoryId == category.Id)),
            ticketsByPriority = Priorities.All.ToDictionary(priorityName => priorityName, priorityName => ticketList.Count(ticket => ticket.Priority == priorityName)),
            ticketsPerDay = Enumerable.Range(0, 30)
                .Select(offset => DateTimeOffset.UtcNow.Date.AddDays(-29 + offset))
                .Select(date => new { date = date.ToString("yyyy-MM-dd"), count = ticketList.Count(ticket => ticket.CreatedAt.Date == date) })
        };

        cache.Set(cacheKey, stats, TimeSpan.FromSeconds(30));
        return Ok(stats);
    }

    [HttpGet("agents")]
    public IActionResult Agents()
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;

        if (cache.TryGetValue("dashboard-agents", out object? cachedAgents))
        {
            return Ok(cachedAgents);
        }

        var agents = Store.Users.Values
            .Where(user => user.Role == Roles.Agent)
            .Select(agent =>
            {
                var assigned = Store.Tickets.Values.Where(ticket => ticket.AssignedAgentId == agent.Id).ToList();
                var resolved = assigned.Where(ticket => ticket.ResolvedAt is not null).ToList();
                return new
                {
                    agentId = agent.Id,
                    agentName = agent.FullName,
                    openTickets = assigned.Count(ticket => TicketStatuses.Open.Contains(ticket.Status)),
                    resolvedToday = resolved.Count(ticket => ticket.ResolvedAt?.Date == DateTimeOffset.UtcNow.Date),
                    avgResolutionHours = resolved.Count == 0 ? 0 : Math.Round(resolved.Average(ticket => (ticket.ResolvedAt!.Value - ticket.CreatedAt).TotalHours), 2)
                };
            })
            .ToList();

        cache.Set("dashboard-agents", agents, TimeSpan.FromSeconds(30));
        return Ok(agents);
    }
}
