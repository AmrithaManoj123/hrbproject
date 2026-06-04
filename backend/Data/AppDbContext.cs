using Microsoft.EntityFrameworkCore;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();
    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();
    public DbSet<TicketHistoryEntry> TicketHistoryEntries => Set<TicketHistoryEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(user => user.Id).HasDefaultValueSql("NEWID()");
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.FullName).HasMaxLength(100).IsRequired();
            entity.Property(user => user.Email).HasMaxLength(255).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(user => user.Role).HasMaxLength(20).IsRequired();
            entity.Property(user => user.IsActive).HasDefaultValue(true);
            entity.Property(user => user.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasIndex(team => team.Name).IsUnique();
            entity.Property(team => team.Name).HasMaxLength(100).IsRequired();
            entity.Property(team => team.Description).HasMaxLength(500);
            entity.Property(team => team.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.HasIndex(member => new { member.TeamId, member.UserId }).IsUnique();
            entity.Property(member => member.Role).HasMaxLength(20).IsRequired();
            entity.HasOne<Team>().WithMany().HasForeignKey(member => member.TeamId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(member => member.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(category => category.Name).IsUnique();
            entity.Property(category => category.Name).HasMaxLength(100).IsRequired();
            entity.HasOne<Team>().WithMany().HasForeignKey(category => category.DefaultTeamId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.Property(ticket => ticket.Title).HasMaxLength(200).IsRequired();
            entity.Property(ticket => ticket.Description).IsRequired();
            entity.Property(ticket => ticket.Status).HasMaxLength(30).IsRequired();
            entity.Property(ticket => ticket.Priority).HasMaxLength(10);
            entity.Property(ticket => ticket.AiPredictedCategory).HasMaxLength(100);
            entity.Property(ticket => ticket.AiPredictedPriority).HasMaxLength(10);
            entity.Property(ticket => ticket.RequiresAgentReview).HasDefaultValue(false);
            entity.Property(ticket => ticket.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            entity.Property(ticket => ticket.UpdatedAt).HasColumnType("datetime2");
            entity.Property(ticket => ticket.SlaDueAt).HasColumnType("datetime2");
            entity.Property(ticket => ticket.ResolvedAt).HasColumnType("datetime2");
            entity.Property(ticket => ticket.ClosedAt).HasColumnType("datetime2");
            entity.HasOne<User>().WithMany().HasForeignKey(ticket => ticket.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(ticket => ticket.AssignedAgentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Team>().WithMany().HasForeignKey(ticket => ticket.AssignedTeamId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Category>().WithMany().HasForeignKey(ticket => ticket.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TicketComment>(entity =>
        {
            entity.Property(comment => comment.Message).IsRequired();
            entity.Property(comment => comment.IsInternal).HasDefaultValue(false);
            entity.Property(comment => comment.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            entity.HasOne<Ticket>().WithMany().HasForeignKey(comment => comment.TicketId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(comment => comment.AuthorId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TicketAttachment>(entity =>
        {
            entity.Property(attachment => attachment.FileName).HasMaxLength(255).IsRequired();
            entity.Property(attachment => attachment.FilePath).HasMaxLength(500).IsRequired();
            entity.Property(attachment => attachment.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(attachment => attachment.UploadedAt).HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            entity.HasOne<Ticket>().WithMany().HasForeignKey(attachment => attachment.TicketId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TicketHistoryEntry>(entity =>
        {
            entity.Property(history => history.FieldName).HasMaxLength(50).IsRequired();
            entity.Property(history => history.OldValue).HasMaxLength(500);
            entity.Property(history => history.NewValue).HasMaxLength(500);
            entity.Property(history => history.ChangedAt).HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            entity.HasOne<Ticket>().WithMany().HasForeignKey(history => history.TicketId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(history => history.ChangedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
