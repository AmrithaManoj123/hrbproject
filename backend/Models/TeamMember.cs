public class TeamMember
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public Guid UserId { get; set; }
    public required string Role { get; set; }
}
