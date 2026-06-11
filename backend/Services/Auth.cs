using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

public static class Auth
{
    public static User? CurrentUser(HttpContext context)
    {
        var principal = context.User.Identity?.IsAuthenticated == true ? context.User : null;

        var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) && Store.Users.TryGetValue(userId, out var user) ? user : null;
    }

    public static AuthCheck RequireRole(HttpContext context, string role)
    {
        var user = CurrentUser(context);
        if (user is null) return new(null, Api.Unauthorized());
        return user.Role == role ? new(user, null) : new(null, Api.Forbidden());
    }

    public static AuthCheck RequireAnyRole(HttpContext context, params string[] roles)
    {
        var user = CurrentUser(context);
        if (user is null) return new(null, Api.Unauthorized());
        return roles.Contains(user.Role) ? new(user, null) : new(null, Api.Forbidden());
    }

    public static TicketAccess RequireTicketAccess(HttpContext context, long ticketId)
    {
        var user = CurrentUser(context);
        if (user is null) return new(null, null, Api.Unauthorized());
        if (!Store.Tickets.TryGetValue(ticketId, out var ticket)) return new(user, null, Api.NotFound("Ticket not found"));

        var allowed = user.Role == Roles.Admin ||
            (user.Role == Roles.Customer && ticket.CreatedByUserId == user.Id) ||
            (user.Role == Roles.Agent && ticket.AssignedAgentId == user.Id);

        return allowed ? new(user, ticket, null) : new(user, null, Api.Forbidden());
    }
}

public static class Tokens
{
    public static string Issue(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: AppFeatures.JwtIssuer,
            audience: AppFeatures.JwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(AppFeatures.JwtExpiryHours),
            signingCredentials: new SigningCredentials(SigningKey(), SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static ClaimsPrincipal? Validate(string token)
    {
        try
        {
            return new JwtSecurityTokenHandler().ValidateToken(token, ValidationParameters(), out _);
        }
        catch
        {
            return null;
        }
    }

    public static TokenValidationParameters ValidationParameters() => new()
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = SigningKey(),
        ValidateIssuer = true,
        ValidIssuer = AppFeatures.JwtIssuer,
        ValidateAudience = true,
        ValidAudience = AppFeatures.JwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(2),
        NameClaimType = ClaimTypes.NameIdentifier,
        RoleClaimType = ClaimTypes.Role
    };

    private static SymmetricSecurityKey SigningKey() => new(Encoding.UTF8.GetBytes(AppFeatures.JwtSecret));
}

public static class Passwords
{
    public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

    public static bool Verify(string password, string passwordHash)
    {
        if (passwordHash.StartsWith("$2", StringComparison.Ordinal))
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }

        return VerifyLegacyPbkdf2(password, passwordHash);
    }

    private static bool VerifyLegacyPbkdf2(string password, string passwordHash)
    {
        var parts = passwordHash.Split('.');
        if (parts.Length != 2) return false;
        var salt = Convert.FromBase64String(parts[0]);
        var expected = Convert.FromBase64String(parts[1]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(expected, actual);
    }
}
