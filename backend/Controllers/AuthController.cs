using Microsoft.AspNetCore.Mvc;
using FluentValidation;

[ApiController]
// This controller handles the authentication endpoints used by the frontend.
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("register")]
    public IActionResult Register(RegisterRequest request, [FromServices] IValidator<RegisterRequest> validator)
    {
        request = new RegisterRequest(request.FullName.Trim(), request.Email.Trim(), request.Password.Trim());

        // Validate the incoming registration data before creating a user.
        var errors = validator.Validate(request).ToValidationErrors();
        if (errors.Count > 0) return Api.Validation(errors);

        // Normalize email so login and duplicate checks are case-insensitive.
        var normalizedEmail = request.Email.ToLowerInvariant();
        if (Store.Users.Values.Any(user => user.Email == normalizedEmail))
        {
            return Api.BadRequest("Email already exists");
        }

        // Store only the password hash, never the plain password.
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = normalizedEmail,
            PasswordHash = Passwords.Hash(request.Password),
            Role = Roles.Customer,
            CreatedAt = DateTimeOffset.UtcNow
        };

        // Save the new user in the in-memory store for this demo application.
        Store.Users[user.Id] = user;
        return Ok(new AuthResponse(Tokens.Issue(user), Api.ToUserDto(user)));
    }

    [HttpPost("login")]
    public IActionResult Login(LoginRequest request, [FromServices] IValidator<LoginRequest> validator)
    {
        request = new LoginRequest(request.Email.Trim(), request.Password.Trim());

        // Validate login fields before checking credentials.
        var errors = validator.Validate(request).ToValidationErrors();
        if (errors.Count > 0) return Api.Validation(errors);

        // Find the user by normalized email so casing does not affect login.
        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = Store.Users.Values.FirstOrDefault(candidate => candidate.Email == normalizedEmail);

        // Reject missing users, wrong passwords, and disabled accounts with the same message.
        if (user is null || !Passwords.Verify(request.Password, user.PasswordHash) || !user.IsActive)
        {
            return Api.Unauthorized("Invalid email or password");
        }

        // Return a JWT plus a safe user DTO for the frontend session.
        return Ok(new AuthResponse(Tokens.Issue(user), Api.ToUserDto(user)));
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        // Read the current user from the JWT already attached to HttpContext.
        var currentUser = Auth.CurrentUser(HttpContext);
        return currentUser is null ? Api.Unauthorized() : Ok(Api.ToUserDto(currentUser));
    }
}
