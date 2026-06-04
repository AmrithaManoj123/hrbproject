public class Ticket
{
    public long Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Status { get; set; }
    public string? Priority { get; set; }
    public int? CategoryId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedAgentId { get; set; }
    public int? AssignedTeamId { get; set; }
    public string? AiPredictedCategory { get; set; }
    public string? AiPredictedPriority { get; set; }
    public double? AiConfidenceScore { get; set; }
    public double? AiPriorityConfidenceScore { get; set; }
    public bool RequiresAgentReview { get; set; }
    public DateTimeOffset? SlaDueAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }
}
