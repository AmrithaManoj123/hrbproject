using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    [HttpGet]
    public IActionResult List()
    {
        var currentUser = Auth.CurrentUser(HttpContext);
        if (currentUser is null) return Api.Unauthorized();

        return Ok(Store.Categories.Values.OrderBy(category => category.Name).Select(category => new
        {
            category.Id,
            category.Name,
            category.DefaultTeamId,
            defaultTeamName = Store.Teams.TryGetValue(category.DefaultTeamId, out var team) ? team.Name : null
        }));
    }

    [HttpPost]
    public IActionResult Create(CreateCategoryRequest request)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;

        var validation = Validate(request.Name, request.DefaultTeamId);
        if (validation is not null) return validation;
        if (Store.Categories.Values.Any(category => category.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase))) return Api.BadRequest("Category already exists");

        var category = new Category
        {
            Id = Store.Categories.Keys.DefaultIfEmpty().Max() + 1,
            Name = request.Name.Trim(),
            DefaultTeamId = request.DefaultTeamId
        };
        Store.Categories[category.Id] = category;

        return Created($"/api/categories/{category.Id}", category);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, UpdateCategoryRequest request)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Categories.TryGetValue(id, out var category)) return Api.NotFound("Category not found");

        var validation = Validate(request.Name, request.DefaultTeamId);
        if (validation is not null) return validation;
        if (Store.Categories.Values.Any(existing => existing.Id != id && existing.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase))) return Api.BadRequest("Category already exists");

        category.Name = request.Name.Trim();
        category.DefaultTeamId = request.DefaultTeamId;
        return Ok(category);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var currentUser = Auth.RequireRole(HttpContext, Roles.Admin);
        if (currentUser.Result is not null) return currentUser.Result;
        if (!Store.Categories.ContainsKey(id)) return Api.NotFound("Category not found");
        if (Store.Tickets.Values.Any(ticket => ticket.CategoryId == id)) return Api.BadRequest("Category is used by tickets");

        Store.Categories.TryRemove(id, out _);
        return NoContent();
    }

    private static IActionResult? Validate(string name, int defaultTeamId)
    {
        var errors = new List<ValidationError>();
        if (string.IsNullOrWhiteSpace(name)) errors.Add(new("name", "Name is required"));
        if (!Store.Teams.ContainsKey(defaultTeamId)) errors.Add(new("defaultTeamId", "Default team is required"));
        return errors.Count == 0 ? null : Api.Validation(errors);
    }
}
