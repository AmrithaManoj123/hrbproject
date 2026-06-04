using Microsoft.AspNetCore.Mvc;

public static class Api
{
    public static IActionResult Validation(List<ValidationError> details) => new BadRequestObjectResult(new { error = "Validation failed", details });
    public static IActionResult BadRequest(string message) => new BadRequestObjectResult(new { error = message });
    public static IActionResult Unauthorized(string message = "Unauthorized") => new ObjectResult(new { error = message }) { StatusCode = StatusCodes.Status401Unauthorized };
    public static IActionResult Forbidden() => new ObjectResult(new { error = "Forbidden" }) { StatusCode = StatusCodes.Status403Forbidden };
    public static IActionResult NotFound(string message) => new NotFoundObjectResult(new { error = message });

    public static UserDto ToUserDto(User user) => new(user.Id, user.FullName, user.Email, user.Role);

    public static TicketListItem ToTicketListItem(Ticket ticket) => new(
        ticket.Id,
        ticket.Title,
        ticket.Status,
        ticket.Priority,
        ticket.CategoryId is null ? null : Store.Categories[ticket.CategoryId.Value].Name,
        ticket.AssignedAgentId is null ? null : Store.Users[ticket.AssignedAgentId.Value].FullName,
        Store.Users[ticket.CreatedByUserId].FullName,
        Store.Users[ticket.CreatedByUserId].Email,
        ticket.AiPredictedCategory,
        ticket.AiConfidenceScore,
        ticket.RequiresAgentReview,
        ticket.CreatedAt,
        ticket.SlaDueAt);

    public static TicketDetailResponse ToTicketDetail(Ticket ticket, string role) => new(
        ticket.Id,
        ticket.Title,
        ticket.Description,
        ticket.Status,
        ticket.Priority,
        ticket.CategoryId is null ? null : new CategoryDto(ticket.CategoryId.Value, Store.Categories[ticket.CategoryId.Value].Name),
        ToUserDto(Store.Users[ticket.CreatedByUserId]),
        ticket.AssignedAgentId is null ? null : ToUserDto(Store.Users[ticket.AssignedAgentId.Value]),
        ticket.AssignedTeamId is null ? null : new TeamDto(ticket.AssignedTeamId.Value, Store.Teams[ticket.AssignedTeamId.Value].Name),
        ticket.AiPredictedCategory,
        ticket.AiPredictedPriority,
        ticket.AiConfidenceScore,
        ticket.AiPriorityConfidenceScore,
        ticket.RequiresAgentReview,
        ticket.SlaDueAt,
        ticket.CreatedAt,
        ticket.UpdatedAt,
        Store.Comments.Values
            .Where(comment => comment.TicketId == ticket.Id)
            .Where(comment => role != Roles.Customer || !comment.IsInternal)
            .OrderBy(comment => comment.CreatedAt)
            .Select(ToCommentDto)
            .ToList(),
        Store.Attachments.Values
            .Where(attachment => attachment.TicketId == ticket.Id)
            .Select(attachment => new
            {
                attachment.Id,
                attachment.FileName,
                attachment.FileSize,
                downloadUrl = $"/api/attachments/{attachment.Id}"
            })
            .Cast<object>()
            .ToList(),
        Store.History.Values
            .Where(history => history.TicketId == ticket.Id)
            .OrderBy(history => history.ChangedAt)
            .Select(history => new HistoryDto(history.FieldName, history.OldValue, history.NewValue, history.ChangedAt))
            .ToList());

    public static CommentDto ToCommentDto(TicketComment comment) => new(
        comment.Id,
        Store.Users[comment.AuthorId].FullName,
        comment.Message,
        comment.IsInternal,
        comment.CreatedAt);
}
