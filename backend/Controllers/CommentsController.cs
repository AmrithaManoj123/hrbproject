using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/tickets/{ticketId:long}/comments")]
public class CommentsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long ticketId)
    {
        var access = Auth.RequireTicketAccess(HttpContext, ticketId);
        if (access.Result is not null) return access.Result;

        var comments = Store.Comments.Values
            .Where(comment => comment.TicketId == ticketId)
            .Where(comment => access.User!.Role != Roles.Customer || !comment.IsInternal)
            .OrderBy(comment => comment.CreatedAt)
            .Select(Api.ToCommentDto);

        return Ok(comments);
    }

    [HttpPost]
    public IActionResult Create(long ticketId, CreateCommentRequest request)
    {
        var access = Auth.RequireTicketAccess(HttpContext, ticketId);
        if (access.Result is not null) return access.Result;
        if (string.IsNullOrWhiteSpace(request.Message)) return Api.Validation([new("message", "Message is required")]);

        var isInternal = access.User!.Role != Roles.Customer && request.IsInternal;
        var comment = new TicketComment
        {
            Id = Store.NextCommentId(),
            TicketId = ticketId,
            AuthorId = access.User.Id,
            Message = request.Message.Trim(),
            IsInternal = isInternal,
            CreatedAt = DateTimeOffset.UtcNow
        };

        Store.Comments[comment.Id] = comment;
        return Created($"/api/tickets/{ticketId}/comments/{comment.Id}", Api.ToCommentDto(comment));
    }
}
