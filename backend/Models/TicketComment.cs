public class TicketComment
{
    public long Id { get; set; }
    public long TicketId { get; set; }
    public Guid AuthorId { get; set; }
    public required string Message { get; set; }
    public bool IsInternal { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
