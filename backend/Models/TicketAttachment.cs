public class TicketAttachment
{
    public long Id { get; set; }
    public long TicketId { get; set; }
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public long FileSize { get; set; }
    public required string ContentType { get; set; }
    public DateTimeOffset UploadedAt { get; set; }
}
