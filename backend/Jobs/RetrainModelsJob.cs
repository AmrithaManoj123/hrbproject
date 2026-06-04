public static class RetrainModelsJob
{
    public static void Execute()
    {
        var categoryPath = Path.Combine(Directory.GetCurrentDirectory(), "backend", "ML", "training_data.csv");
        var priorityPath = Path.Combine(Directory.GetCurrentDirectory(), "backend", "ML", "priority_training_data.csv");
        var categoryModelPath = Path.Combine(Directory.GetCurrentDirectory(), "backend", "ML", "category-fasttree-model.zip");
        var priorityModelPath = Path.Combine(Directory.GetCurrentDirectory(), "backend", "ML", "priority-fasttree-model.zip");

        ModelTrainer.EnsureCategoryTrainingData(categoryPath);
        ModelTrainer.EnsurePriorityTrainingData(priorityPath);
        AppendOverrides(categoryPath, priorityPath);

        ModelTrainer.TrainCategoryModel(categoryPath, categoryModelPath);
        ModelTrainer.TrainPriorityModel(priorityPath, priorityModelPath);
    }

    private static void AppendOverrides(string categoryPath, string priorityPath)
    {
        var categoryOverrides = Store.History.Values
            .Where(history => history.FieldName == "CategoryId" && history.NewValue is not null)
            .Select(history => Store.Tickets.TryGetValue(history.TicketId, out var ticket) && int.TryParse(history.NewValue, out var categoryId) && Store.Categories.TryGetValue(categoryId, out var category)
                ? $"\"{Escape(ticket.Title + " " + ticket.Description)}\",{category.Name}"
                : null)
            .Where(line => line is not null)
            .Cast<string>();

        var priorityOverrides = Store.History.Values
            .Where(history => history.FieldName == "Priority" && history.NewValue is not null)
            .Select(history => Store.Tickets.TryGetValue(history.TicketId, out var ticket)
                ? $"{ticket.AiPredictedCategory ?? "General"},{CountWords(ticket.Title + " " + ticket.Description)},{HasUrgency(ticket.Title + " " + ticket.Description)},{history.NewValue}"
                : null)
            .Where(line => line is not null)
            .Cast<string>();

        File.AppendAllLines(categoryPath, categoryOverrides);
        File.AppendAllLines(priorityPath, priorityOverrides);
    }

    private static int CountWords(string text) => text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
    private static int HasUrgency(string text) => new[] { "urgent", "asap", "emergency", "critical", "down", "blocked", "crashed", "broken", "immediately" }.Any(keyword => text.Contains(keyword, StringComparison.OrdinalIgnoreCase)) ? 1 : 0;
    private static string Escape(string value) => value.Replace("\"", "\"\"");
}
