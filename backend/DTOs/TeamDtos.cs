public record CreateTeamRequest(string Name, string? Description);
public record UpdateTeamRequest(string Name, string? Description);
public record AddTeamMemberRequest(Guid UserId, string Role);
public record CreateCategoryRequest(string Name, int DefaultTeamId);
public record UpdateCategoryRequest(string Name, int DefaultTeamId);
