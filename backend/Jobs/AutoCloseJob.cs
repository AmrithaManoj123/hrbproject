public static class AutoCloseJob
{
    public static void Execute()
    {
        var cutoff = DateTimeOffset.UtcNow.AddHours(-48);
        foreach (var ticket in Store.Tickets.Values.Where(ticket => ticket.Status == TicketStatuses.Resolved && ticket.ResolvedAt <= cutoff))
        {
            TicketHistoryService.Add(ticket.Id, "Status", ticket.Status, TicketStatuses.Closed, null);
            ticket.Status = TicketStatuses.Closed;
            ticket.ClosedAt = DateTimeOffset.UtcNow;
            ticket.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }
}
