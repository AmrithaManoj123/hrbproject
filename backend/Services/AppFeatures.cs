// Central place for runtime feature flags and settings loaded during startup.
public static class AppFeatures
{
    // Enables the real SQL Server database instead of the in-memory demo store.
    public static bool UseSqlServer { get; set; }

    // Enables Hangfire background job processing and the Hangfire dashboard.
    public static bool UseHangfire { get; set; }

    // Folder where uploaded files are saved.
    public static string UploadPath { get; set; } = "uploads";

    // Secret key used to sign and validate JWT tokens.
    public static string JwtSecret { get; set; } = "local-development-secret-change-before-production-32";

    // Number of hours a generated JWT remains valid.
    public static int JwtExpiryHours { get; set; } = 24;
}
