public static class AssignmentService
{
    public static void Assign(Ticket ticket)
    {
        if (ticket.CategoryId is null || ticket.Priority is null) return;

        var category = Store.Categories[ticket.CategoryId.Value];
        var teamMembers = Store.TeamMembers.Values.Where(member => member.TeamId == category.DefaultTeamId).ToList();
        var assignee = ticket.Priority == Priorities.Critical
            ? teamMembers.FirstOrDefault(member => member.Role == "lead")
            : teamMembers
                .OrderBy(member => Store.Tickets.Values.Count(candidate =>
                    candidate.AssignedAgentId == member.UserId && TicketStatuses.Open.Contains(candidate.Status)))
                .FirstOrDefault();

        ticket.AssignedTeamId = category.DefaultTeamId;
        ticket.AssignedAgentId = assignee?.UserId;
        ticket.SlaDueAt = Sla.Calculate(DateTimeOffset.UtcNow, ticket.Priority);
        TicketHistoryService.Add(ticket.Id, "Status", ticket.Status, TicketStatuses.Assigned, null);
        ticket.Status = TicketStatuses.Assigned;
    }
}
