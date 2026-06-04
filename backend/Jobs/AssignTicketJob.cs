public static class AssignTicketJob
{
    public static void Execute(long ticketId)
    {
        if (!Store.Tickets.TryGetValue(ticketId, out var ticket)) return;

        AssignmentService.Assign(ticket);
        ticket.UpdatedAt = DateTimeOffset.UtcNow;
    }
}
