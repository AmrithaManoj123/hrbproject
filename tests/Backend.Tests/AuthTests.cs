using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Backend.Tests;

public class AuthTests
{
    [Fact]
    public void Issue_and_validate_round_trips_user_claims()
    {
        ConfigureJwt();
        var user = TestUser();

        var token = Tokens.Issue(user);
        var principal = Tokens.Validate(token);

        Assert.NotNull(principal);
        Assert.Equal(user.Id.ToString(), principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        Assert.Equal(user.Email, principal.FindFirst(ClaimTypes.Email)?.Value);
        Assert.Equal(Roles.Admin, principal.FindFirst(ClaimTypes.Role)?.Value);
    }

    [Fact]
    public void Validate_rejects_tampered_tokens()
    {
        ConfigureJwt();
        var token = Tokens.Issue(TestUser());
        var tamperedToken = token[..^1] + (token[^1] == 'a' ? 'b' : 'a');

        var principal = Tokens.Validate(tamperedToken);

        Assert.Null(principal);
    }

    [Fact]
    public void CurrentUser_returns_store_user_from_authenticated_principal()
    {
        ConfigureJwt();
        var user = TestUser();
        Store.Users[user.Id] = user;
        try
        {
            var principal = Tokens.Validate(Tokens.Issue(user));
            var context = new DefaultHttpContext { User = principal! };

            var currentUser = Auth.CurrentUser(context);

            Assert.NotNull(currentUser);
            Assert.Equal(user.Id, currentUser.Id);
        }
        finally
        {
            Store.Users.TryRemove(user.Id, out _);
        }
    }

    private static User TestUser() => new()
    {
        Id = Guid.NewGuid(),
        FullName = "Test Admin",
        Email = "test.admin@example.com",
        PasswordHash = "unused",
        Role = Roles.Admin,
        CreatedAt = DateTimeOffset.UtcNow
    };

    private static void ConfigureJwt()
    {
        AppFeatures.JwtSecret = "unit-test-secret-key-with-at-least-32-characters";
        AppFeatures.JwtIssuer = "unit-test-api";
        AppFeatures.JwtAudience = "unit-test-frontend";
        AppFeatures.JwtExpiryHours = 1;
    }
}
