public class TicketHistoryEntry
{
    public long Id { get; set; }
    public long TicketId { get; set; }
    public required string FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
}
