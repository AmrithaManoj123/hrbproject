public static class Sla
{
    public static DateTimeOffset Calculate(DateTimeOffset now, string priority) => priority switch
    {
        Priorities.Critical => now.AddMinutes(15),
        Priorities.High => now.AddHours(1),
        Priorities.Medium => now.AddHours(4),
        _ => now.AddHours(8)
    };
}
