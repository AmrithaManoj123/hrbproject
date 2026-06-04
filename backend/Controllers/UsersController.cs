using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    [HttpGet]
    public IActionResult List(string? role = null)
    {
        var currentUser = Auth.RequireAnyRole(HttpContext, Roles.Agent, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;

        var users = Store.Users.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(role))
        {
            users = users.Where(user => user.Role.Equals(role, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(users.OrderBy(user => user.FullName).Select(Api.ToUserDto));
    }
}
