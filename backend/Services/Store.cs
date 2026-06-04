using System.Collections.Concurrent;

public static class Store
{
    private static long ticketId;
    private static long commentId;
    private static long attachmentId;
    private static long historyId;
    private static int teamId = 3;
    private static int teamMemberId;

    public static readonly ConcurrentDictionary<Guid, User> Users = new();
    public static readonly ConcurrentDictionary<int, Team> Teams = new();
    public static readonly ConcurrentDictionary<int, TeamMember> TeamMembers = new();
    public static readonly ConcurrentDictionary<int, Category> Categories = new();
    public static readonly ConcurrentDictionary<long, Ticket> Tickets = new();
    public static readonly ConcurrentDictionary<long, TicketComment> Comments = new();
    public static readonly ConcurrentDictionary<long, TicketAttachment> Attachments = new();
    public static readonly ConcurrentDictionary<long, TicketHistoryEntry> History = new();

    static Store()
    {
        var admin = AddUser("Platform Admin", "admin@company.com", "Admin123!", Roles.Admin);
        var financeLead = AddUser("Finance Lead", "finance.lead@company.com", "Agent123!", Roles.Agent);
        var financeAgent = AddUser("Finance Agent", "finance.agent@company.com", "Agent123!", Roles.Agent);
        var engineeringLead = AddUser("Engineering Lead", "engineering.lead@company.com", "Agent123!", Roles.Agent);
        var supportLead = AddUser("Support Lead", "support.lead@company.com", "Agent123!", Roles.Agent);
        var supportAgent = AddUser("Support Agent", "support.agent@company.com", "Agent123!", Roles.Agent);
        _ = admin;

        Teams[1] = new Team { Id = 1, Name = "Finance Team", Description = "Billing and payment issues", CreatedAt = DateTimeOffset.UtcNow };
        Teams[2] = new Team { Id = 2, Name = "Engineering Team", Description = "Technical product issues", CreatedAt = DateTimeOffset.UtcNow };
        Teams[3] = new Team { Id = 3, Name = "Support Team", Description = "Account, feature, and general support", CreatedAt = DateTimeOffset.UtcNow };

        AddMember(1, financeLead.Id, "lead");
        AddMember(1, financeAgent.Id, "member");
        AddMember(2, engineeringLead.Id, "lead");
        AddMember(3, supportLead.Id, "lead");
        AddMember(3, supportAgent.Id, "member");

        Categories[1] = new Category { Id = 1, Name = "Billing", DefaultTeamId = 1 };
        Categories[2] = new Category { Id = 2, Name = "Technical", DefaultTeamId = 2 };
        Categories[3] = new Category { Id = 3, Name = "Account", DefaultTeamId = 3 };
        Categories[4] = new Category { Id = 4, Name = "Feature Request", DefaultTeamId = 3 };
        Categories[5] = new Category { Id = 5, Name = "General", DefaultTeamId = 3 };
    }

    public static long NextTicketId() => Interlocked.Increment(ref ticketId);
    public static long NextCommentId() => Interlocked.Increment(ref commentId);
    public static long NextAttachmentId() => Interlocked.Increment(ref attachmentId);
    public static long NextHistoryId() => Interlocked.Increment(ref historyId);
    public static int NextTeamId() => Interlocked.Increment(ref teamId);
    public static int NextTeamMemberId() => Interlocked.Increment(ref teamMemberId);

    private static User AddUser(string fullName, string email, string password, string role)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = email,
            PasswordHash = Passwords.Hash(password),
            Role = role,
            CreatedAt = DateTimeOffset.UtcNow
        };
        Users[user.Id] = user;
        return user;
    }

    private static void AddMember(int teamId, Guid userId, string role)
    {
        var member = new TeamMember { Id = NextTeamMemberId(), TeamId = teamId, UserId = userId, Role = role };
        TeamMembers[member.Id] = member;
    }
}
