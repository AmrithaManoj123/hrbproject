using Microsoft.AspNetCore.Mvc;

[ApiController]
public class AttachmentsController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf",
        ".doc",
        ".docx",
        ".txt"
    };

    [HttpPost("api/tickets/{ticketId:long}/attachments")]
    [RequestSizeLimit(15_728_640)]
    public async Task<IActionResult> Upload(long ticketId, IFormFile file)
    {
        var access = Auth.RequireTicketAccess(HttpContext, ticketId);
        if (access.Result is not null) return access.Result;
        if (file.Length == 0) return Api.BadRequest("File is required");
        if (file.Length > 5 * 1024 * 1024) return Api.BadRequest("File must be 5MB or smaller");
        if (Store.Attachments.Values.Count(attachment => attachment.TicketId == ticketId) >= 3) return Api.BadRequest("A ticket can have up to 3 attachments");

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension)) return Api.BadRequest("Unsupported file type");

        var safeName = Path.GetFileName(file.FileName);
        var storedName = $"{ticketId}-{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(AppFeatures.UploadPath, storedName);

        await using (var stream = System.IO.File.Create(path))
        {
            await file.CopyToAsync(stream);
        }

        var attachment = new TicketAttachment
        {
            Id = Store.NextAttachmentId(),
            TicketId = ticketId,
            FileName = safeName,
            FilePath = path,
            FileSize = file.Length,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            UploadedAt = DateTimeOffset.UtcNow
        };
        Store.Attachments[attachment.Id] = attachment;

        return Created($"/api/attachments/{attachment.Id}", new
        {
            attachment.Id,
            attachment.FileName,
            attachment.FileSize,
            downloadUrl = $"/api/attachments/{attachment.Id}"
        });
    }

    [HttpGet("api/attachments/{id:long}")]
    public IActionResult Download(long id)
    {
        if (!Store.Attachments.TryGetValue(id, out var attachment)) return Api.NotFound("Attachment not found");

        var access = Auth.RequireTicketAccess(HttpContext, attachment.TicketId);
        if (access.Result is not null) return access.Result;
        if (!System.IO.File.Exists(attachment.FilePath)) return Api.NotFound("Attachment file not found");

        return PhysicalFile(Path.GetFullPath(attachment.FilePath), attachment.ContentType, attachment.FileName);
    }
}
