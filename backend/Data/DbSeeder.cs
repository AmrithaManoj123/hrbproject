public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (!db.Users.Any())
        {
            var admin = AddUser(db, "Platform Admin", "admin@company.com", "Admin123!", Roles.Admin);
            var financeLead = AddUser(db, "Finance Lead", "finance.lead@company.com", "Agent123!", Roles.Agent);
            var financeAgent = AddUser(db, "Finance Agent", "finance.agent@company.com", "Agent123!", Roles.Agent);
            var engineeringLead = AddUser(db, "Engineering Lead", "engineering.lead@company.com", "Agent123!", Roles.Agent);
            var supportLead = AddUser(db, "Support Lead", "support.lead@company.com", "Agent123!", Roles.Agent);
            var supportAgent = AddUser(db, "Support Agent", "support.agent@company.com", "Agent123!", Roles.Agent);
            AddUser(db, "Amritha Manoj", "amrithamanoj@gmail.com", "password12345678", Roles.Customer);
            _ = admin;

            db.Teams.AddRange(
                new Team { Id = 1, Name = "Finance Team", Description = "Billing and payment issues", CreatedAt = DateTimeOffset.UtcNow },
                new Team { Id = 2, Name = "Engineering Team", Description = "Technical product issues", CreatedAt = DateTimeOffset.UtcNow },
                new Team { Id = 3, Name = "Support Team", Description = "Account, feature, and general support", CreatedAt = DateTimeOffset.UtcNow });

            db.TeamMembers.AddRange(
                new TeamMember { TeamId = 1, UserId = financeLead.Id, Role = "lead" },
                new TeamMember { TeamId = 1, UserId = financeAgent.Id, Role = "member" },
                new TeamMember { TeamId = 2, UserId = engineeringLead.Id, Role = "lead" },
                new TeamMember { TeamId = 3, UserId = supportLead.Id, Role = "lead" },
                new TeamMember { TeamId = 3, UserId = supportAgent.Id, Role = "member" });

            db.Categories.AddRange(
                new Category { Id = 1, Name = "Billing", DefaultTeamId = 1 },
                new Category { Id = 2, Name = "Technical", DefaultTeamId = 2 },
                new Category { Id = 3, Name = "Account", DefaultTeamId = 3 },
                new Category { Id = 4, Name = "Feature Request", DefaultTeamId = 3 },
                new Category { Id = 5, Name = "General", DefaultTeamId = 3 });
        }

        db.SaveChanges();
    }

    private static User AddUser(AppDbContext db, string fullName, string email, string password, string role)
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
        db.Users.Add(user);
        return user;
    }
}
