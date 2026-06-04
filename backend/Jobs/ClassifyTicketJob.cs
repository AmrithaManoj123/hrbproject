public static class ClassifyTicketJob
{
    public static void Execute(long ticketId)
    {
        if (!Store.Tickets.TryGetValue(ticketId, out var ticket)) return;

        var classification = MlService.Classify($"{ticket.Title} {ticket.Description}");
        ticket.AiPredictedCategory = classification.Category;
        ticket.AiConfidenceScore = classification.Confidence;
        ticket.RequiresAgentReview = classification.Confidence < 0.85;

        if (classification.Confidence < 0.60)
        {
            TicketHistoryService.Add(ticket.Id, "Status", ticket.Status, TicketStatuses.NeedsReview, null);
            ticket.Status = TicketStatuses.NeedsReview;
            ticket.UpdatedAt = DateTimeOffset.UtcNow;
            return;
        }

        var category = Store.Categories.Values.First(candidate => candidate.Name == classification.Category);
        ticket.CategoryId = category.Id;
        TicketHistoryService.Add(ticket.Id, "Status", ticket.Status, TicketStatuses.Classified, null);
        ticket.Status = TicketStatuses.Classified;
        if (ticket.RequiresAgentReview)
        {
            TicketHistoryService.Add(ticket.Id, "AI_REVIEW", null, "Agent review recommended", null);
        }

        ticket.UpdatedAt = DateTimeOffset.UtcNow;
        TicketJobDispatcher.EnqueuePredictPriority(ticket.Id);
    }
}
