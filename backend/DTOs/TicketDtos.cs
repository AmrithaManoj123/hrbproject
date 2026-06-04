using Microsoft.AspNetCore.Mvc;

public record CreateTicketRequest(string Title, string Description, int? CategoryId = null);
public record ChangeStatusRequest(string Status);
public record ChangePriorityRequest(string Priority);
public record ChangeCategoryRequest(int CategoryId);
public record AssignTicketRequest(Guid AgentId, int TeamId);
public record AiReplyResponse(string Reply);
public record CreateCommentRequest(string Message, bool IsInternal);
public record CategoryDto(int Id, string Name);
public record TeamDto(int Id, string Name);
public record CommentDto(long Id, string AuthorName, string Message, bool IsInternal, DateTimeOffset CreatedAt);
public record HistoryDto(string FieldName, string? OldValue, string? NewValue, DateTimeOffset ChangedAt);
public record ValidationError(string Field, string Message);
public record ClassificationResult(string Category, double Confidence);
public record PriorityResult(string Priority, double Confidence);
public record AuthCheck(User? User, IActionResult? Result);
public record TicketAccess(User? User, Ticket? Ticket, IActionResult? Result);
public record PaginatedResponse<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);
public record TicketListItem(
    long Id,
    string Title,
    string Status,
    string? Priority,
    string? CategoryName,
    string? AssignedAgentName,
    string CustomerName,
    string CustomerEmail,
    string? AiPredictedCategory,
    double? AiConfidenceScore,
    bool RequiresAgentReview,
    DateTimeOffset CreatedAt,
    DateTimeOffset? SlaDueAt);
public record TicketDetailResponse(
    long Id,
    string Title,
    string Description,
    string Status,
    string? Priority,
    CategoryDto? Category,
    UserDto CreatedBy,
    UserDto? AssignedAgent,
    TeamDto? AssignedTeam,
    string? AiPredictedCategory,
    string? AiPredictedPriority,
    double? AiConfidenceScore,
    double? AiPriorityConfidenceScore,
    bool RequiresAgentReview,
    DateTimeOffset? SlaDueAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<CommentDto> Comments,
    IReadOnlyList<object> Attachments,
    IReadOnlyList<HistoryDto> History);
