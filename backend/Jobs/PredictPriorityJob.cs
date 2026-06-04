public static class PredictPriorityJob
{
    public static void Execute(long ticketId)
    {
        if (!Store.Tickets.TryGetValue(ticketId, out var ticket)) return;
        if (ticket.AiPredictedCategory is null) return;

        var priority = MlService.PredictPriority(ticket.AiPredictedCategory, $"{ticket.Title} {ticket.Description}");
        ticket.AiPredictedPriority = priority.Priority;
        ticket.AiPriorityConfidenceScore = priority.Confidence;
        ticket.Priority = priority.Priority;
        TicketHistoryService.Add(ticket.Id, "Status", ticket.Status, TicketStatuses.Prioritized, null);
        ticket.Status = TicketStatuses.Prioritized;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        TicketJobDispatcher.EnqueueAssign(ticket.Id);
    }
}
