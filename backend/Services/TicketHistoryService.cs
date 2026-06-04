public static class TicketHistoryService
{
    public static void Add(long ticketId, string field, string? oldValue, string? newValue, Guid? changedByUserId)
    {
        var entry = new TicketHistoryEntry
        {
            Id = Store.NextHistoryId(),
            TicketId = ticketId,
            FieldName = field,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedByUserId = changedByUserId,
            ChangedAt = DateTimeOffset.UtcNow
        };
        Store.History[entry.Id] = entry;
    }
}
