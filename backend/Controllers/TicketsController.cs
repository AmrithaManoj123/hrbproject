using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;

[ApiController]
[Authorize]
[Route("api/tickets")]
public class TicketsController : ControllerBase
{
    private readonly AiReplyService aiReplies;

    public TicketsController(AiReplyService aiReplies)
    {
        this.aiReplies = aiReplies;
    }

    [HttpPost]
    public IActionResult Create(CreateTicketRequest request, [FromServices] IValidator<CreateTicketRequest> validator)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Customer);
        if (currentUser.Result is not null) return currentUser.Result;

        var errors = validator.Validate(request).ToValidationErrors();
        if (errors.Count > 0) return Api.Validation(errors);

        var ticket = new Ticket
        {
            Id = Store.NextTicketId(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Status = TicketStatuses.New,
            CreatedByUserId = currentUser.User!.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        Store.Tickets[ticket.Id] = ticket;
        TicketHistoryService.Add(ticket.Id, "Status", null, TicketStatuses.New, null);
        TicketJobDispatcher.EnqueueClassify(ticket.Id);

        return Created($"/api/tickets/{ticket.Id}", new
        {
            ticket.Id,
            ticket.Title,
            ticket.Status,
            ticket.CreatedAt
        });
    }

    [HttpGet]
    public IActionResult List(int page = 1, int pageSize = 10, string? status = null, string? priority = null, string? search = null)
    {
        var currentUser = Auth.CurrentUser(HttpContext);
        if (currentUser is null) return Api.Unauthorized();

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = Store.Tickets.Values.AsEnumerable();
        query = currentUser.Role switch
        {
            Roles.Customer => query.Where(ticket => ticket.CreatedByUserId == currentUser.Id),
            Roles.Agent => query.Where(ticket => ticket.AssignedAgentId == currentUser.Id),
            _ => query
        };

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(ticket => ticket.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(ticket => ticket.Priority?.Equals(priority, StringComparison.OrdinalIgnoreCase) == true);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(ticket =>
                ticket.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                ticket.Description.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = query.OrderByDescending(ticket => ticket.CreatedAt).ToList();
        var totalCount = ordered.Count;
        var items = ordered.Skip((page - 1) * pageSize).Take(pageSize).Select(Api.ToTicketListItem).ToList();

        return Ok(new PaginatedResponse<TicketListItem>(
            items,
            totalCount,
            page,
            pageSize,
            (int)Math.Ceiling(totalCount / (double)pageSize)));
    }

    [HttpGet("{id:long}")]
    public IActionResult Detail(long id)
    {
        var access = Auth.RequireTicketAccess(HttpContext, id);
        if (access.Result is not null) return access.Result;

        return Ok(Api.ToTicketDetail(access.Ticket!, access.User!.Role));
    }

    [HttpPut("{id:long}/status")]
    public IActionResult ChangeStatus(long id, ChangeStatusRequest request)
    {
        var currentUser = Auth.RequireAnyRole(HttpContext, Roles.Agent, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;

        if (!Store.Tickets.TryGetValue(id, out var ticket)) return Api.NotFound("Ticket not found");
        if (currentUser.User!.Role == Roles.Agent && ticket.AssignedAgentId != currentUser.User.Id) return Api.Forbidden();
        if (!TicketStatuses.IsValidAgentTransition(ticket.Status, request.Status)) return Api.BadRequest("Invalid status transition");

        TicketHistoryService.Add(ticket.Id, "Status", ticket.Status, request.Status, currentUser.User.Id);
        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;
        if (request.Status == TicketStatuses.Resolved) ticket.ResolvedAt = DateTimeOffset.UtcNow;

        return Ok(new { ticket.Id, ticket.Status, ticket.UpdatedAt });
    }

    [HttpPut("{id:long}/priority")]
    public IActionResult ChangePriority(long id, ChangePriorityRequest request)
    {
        var currentUser = Auth.RequireAnyRole(HttpContext, Roles.Agent, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Priorities.All.Contains(request.Priority)) return Api.BadRequest("Invalid priority");
        if (!Store.Tickets.TryGetValue(id, out var ticket)) return Api.NotFound("Ticket not found");

        TicketHistoryService.Add(ticket.Id, "Priority", ticket.Priority, request.Priority, currentUser.User!.Id);
        ticket.Priority = request.Priority;
        ticket.AiPredictedPriority ??= request.Priority;
        ticket.SlaDueAt = Sla.Calculate(DateTimeOffset.UtcNow, request.Priority);
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        return Ok(new { ticket.Id, ticket.Priority, ticket.SlaDueAt });
    }

    [HttpPut("{id:long}/category")]
    public IActionResult ChangeCategory(long id, ChangeCategoryRequest request)
    {
        var currentUser = Auth.RequireAnyRole(HttpContext, Roles.Agent, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Categories.TryGetValue(request.CategoryId, out var category)) return Api.BadRequest("Invalid category");
        if (!Store.Tickets.TryGetValue(id, out var ticket)) return Api.NotFound("Ticket not found");

        TicketHistoryService.Add(ticket.Id, "CategoryId", ticket.CategoryId?.ToString(), request.CategoryId.ToString(), currentUser.User!.Id);
        ticket.CategoryId = request.CategoryId;
        ticket.AiPredictedCategory ??= category.Name;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        return Ok(new { ticket.Id, ticket.CategoryId, categoryName = category.Name });
    }

    [HttpPut("{id:long}/assign")]
    public IActionResult Assign(long id, AssignTicketRequest request)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Tickets.TryGetValue(id, out var ticket)) return Api.NotFound("Ticket not found");
        if (!Store.Teams.ContainsKey(request.TeamId)) return Api.BadRequest("Invalid team");
        if (!Store.Users.TryGetValue(request.AgentId, out var agent) || agent.Role != Roles.Agent) return Api.BadRequest("Invalid agent");

        TicketHistoryService.Add(ticket.Id, "AssignedAgentId", ticket.AssignedAgentId?.ToString(), request.AgentId.ToString(), currentUser.User!.Id);
        ticket.AssignedAgentId = request.AgentId;
        ticket.AssignedTeamId = request.TeamId;
        ticket.Status = TicketStatuses.Assigned;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        return Ok(new { ticket.Id, ticket.AssignedAgentId, ticket.AssignedTeamId });
    }

    [HttpPost("{id:long}/ai-reply")]
    public async Task<IActionResult> SuggestReply(long id, CancellationToken cancellationToken)
    {
        var currentUser = Auth.RequireAnyRole(HttpContext, Roles.Agent, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Tickets.TryGetValue(id, out var ticket)) return Api.NotFound("Ticket not found");
        if (currentUser.User!.Role == Roles.Agent && ticket.AssignedAgentId != currentUser.User.Id) return Api.Forbidden();

        var customer = Store.Users[ticket.CreatedByUserId];
        var result = await aiReplies.GenerateReplyAsync(ticket, customer, cancellationToken);
        if (result.Error is not null) return Api.BadRequest(result.Error);
        if (result.Reply is null) return Api.BadRequest("AI reply generation returned an empty response.");

        return Ok(new AiReplyResponse(result.Reply));
    }
}
