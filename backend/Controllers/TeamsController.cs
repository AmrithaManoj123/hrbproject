using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/teams")]
public class TeamsController : ControllerBase
{
    [HttpGet]
    public IActionResult List()
    {
        var currentUser = Auth.RequireAnyRole(HttpContext, Roles.Agent, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;

        return Ok(Store.Teams.Values.Select(team => new
        {
            team.Id,
            team.Name,
            team.Description,
            memberCount = Store.TeamMembers.Values.Count(member => member.TeamId == team.Id)
        }));
    }

    [HttpPost]
    public IActionResult Create(CreateTeamRequest request)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (string.IsNullOrWhiteSpace(request.Name)) return Api.Validation([new("name", "Name is required")]);
        if (Store.Teams.Values.Any(team => team.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase))) return Api.BadRequest("Team already exists");

        var team = new Team
        {
            Id = Store.NextTeamId(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        Store.Teams[team.Id] = team;
        return Created($"/api/teams/{team.Id}", new { team.Id, team.Name });
    }

    [HttpPost("{id:int}/members")]
    public IActionResult AddMember(int id, AddTeamMemberRequest request)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Teams.ContainsKey(id)) return Api.NotFound("Team not found");
        if (!Store.Users.ContainsKey(request.UserId)) return Api.BadRequest("User not found");

        var member = new TeamMember
        {
            Id = Store.NextTeamMemberId(),
            TeamId = id,
            UserId = request.UserId,
            Role = string.IsNullOrWhiteSpace(request.Role) ? "member" : request.Role.Trim()
        };
        Store.TeamMembers[member.Id] = member;
        return Created($"/api/teams/{id}/members/{member.Id}", new { member.TeamId, member.UserId, member.Role });
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, UpdateTeamRequest request)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Teams.TryGetValue(id, out var team)) return Api.NotFound("Team not found");
        if (string.IsNullOrWhiteSpace(request.Name)) return Api.Validation([new("name", "Name is required")]);
        if (Store.Teams.Values.Any(existing => existing.Id != id && existing.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase))) return Api.BadRequest("Team already exists");

        team.Name = request.Name.Trim();
        team.Description = request.Description?.Trim();
        return Ok(new { team.Id, team.Name, team.Description });
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Teams.ContainsKey(id)) return Api.NotFound("Team not found");
        if (Store.Categories.Values.Any(category => category.DefaultTeamId == id)) return Api.BadRequest("Team is used by a category");
        if (Store.Tickets.Values.Any(ticket => ticket.AssignedTeamId == id)) return Api.BadRequest("Team is assigned to tickets");

        Store.Teams.TryRemove(id, out _);
        foreach (var member in Store.TeamMembers.Values.Where(member => member.TeamId == id).ToList())
        {
            Store.TeamMembers.TryRemove(member.Id, out _);
        }

        return NoContent();
    }
}
