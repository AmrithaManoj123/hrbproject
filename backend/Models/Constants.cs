public static class Roles
{
    public const string Customer = "customer";
    public const string Agent = "agent";
    public const string Admin = "admin";
}

public static class TicketStatuses
{
    public const string New = "NEW";
    public const string Classified = "CLASSIFIED";
    public const string Prioritized = "PRIORITIZED";
    public const string Assigned = "ASSIGNED";
    public const string InProgress = "IN_PROGRESS";
    public const string WaitingCustomer = "WAITING_CUSTOMER";
    public const string Resolved = "RESOLVED";
    public const string Closed = "CLOSED";
    public const string NeedsReview = "NEEDS_REVIEW";

    public static readonly string[] Open = [New, Classified, Prioritized, Assigned, InProgress, WaitingCustomer, NeedsReview];

    public static bool IsValidAgentTransition(string current, string next) => (current, next) switch
    {
        (Assigned, InProgress) => true,
        (InProgress, WaitingCustomer) => true,
        (WaitingCustomer, InProgress) => true,
        (InProgress, Resolved) => true,
        _ => false
    };
}

public static class Priorities
{
    public const string Critical = "CRITICAL";
    public const string High = "HIGH";
    public const string Medium = "MEDIUM";
    public const string Low = "LOW";
    public static readonly string[] All = [Critical, High, Medium, Low];
}
