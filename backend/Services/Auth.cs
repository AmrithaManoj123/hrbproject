using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public static class Auth
{
    public static User? CurrentUser(HttpContext context)
    {
        var principal = context.User.Identity?.IsAuthenticated == true ? context.User : null;
        if (principal is null)
        {
            var header = context.Request.Headers.Authorization.ToString();
            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
            principal = Tokens.Validate(header["Bearer ".Length..]);
        }

        var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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
        var header = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new { alg = "HS256", typ = "JWT" }));
        var payload = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new Dictionary<string, object>
        {
            ["sub"] = user.Id.ToString(),
            ["name"] = user.FullName,
            ["email"] = user.Email,
            ["role"] = user.Role,
            ["exp"] = DateTimeOffset.UtcNow.AddHours(AppFeatures.JwtExpiryHours).ToUnixTimeSeconds()
        }));
        var signature = Sign($"{header}.{payload}");
        return $"{header}.{payload}.{signature}";
    }

    public static ClaimsPrincipal? Validate(string token)
    {
        var parts = token.Split('.');
        if (parts.Length != 3) return null;
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(Sign($"{parts[0]}.{parts[1]}")), Encoding.UTF8.GetBytes(parts[2]))) return null;

        var payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));
        using var document = JsonDocument.Parse(payloadJson);
        var root = document.RootElement;
        if (!root.TryGetProperty("exp", out var exp) || DateTimeOffset.FromUnixTimeSeconds(exp.GetInt64()) < DateTimeOffset.UtcNow) return null;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, root.GetProperty("sub").GetString()!),
            new Claim(ClaimTypes.Name, root.GetProperty("name").GetString()!),
            new Claim(ClaimTypes.Email, root.GetProperty("email").GetString()!),
            new Claim(ClaimTypes.Role, root.GetProperty("role").GetString()!)
        };
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "LocalJwt"));
    }

    private static string Sign(string data)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(AppFeatures.JwtSecret));
        return Base64Url(hmac.ComputeHash(Encoding.UTF8.GetBytes(data)));
    }

    private static string Base64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
        return Convert.FromBase64String(padded);
    }
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
