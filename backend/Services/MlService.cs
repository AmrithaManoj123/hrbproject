using Microsoft.ML;
using Microsoft.ML.Data;

public static class MlService
{
    private static readonly object ModelLock = new();
    private static PredictionEngine<TicketInput, CategoryPrediction>? categoryEngine;
    private static PredictionEngine<PriorityInput, PriorityPrediction>? priorityEngine;

    private static readonly Dictionary<string, string[]> CategoryKeywords = new()
    {
        ["Billing"] = ["refund", "payment", "charged", "invoice", "billing", "card", "price", "paid"],
        ["Technical"] = ["crash", "error", "bug", "export", "login failed", "slow", "broken", "down"],
        ["Account"] = ["password", "reset", "account", "profile", "email", "locked", "sign in"],
        ["Feature Request"] = ["feature", "please add", "dark mode", "request", "improve", "enhancement"],
        ["General"] = ["hours", "contact", "question", "help", "info"]
    };

    private static readonly string[] UrgencyKeywords = ["urgent", "asap", "emergency", "critical", "down", "blocked", "crashed", "broken", "immediately"];

    public static ClassificationResult Classify(string text)
    {
        var mlResult = TryClassifyWithMlNet(text);
        if (mlResult is not null) return mlResult;

        return ClassifyWithRules(text);
    }

    private static ClassificationResult ClassifyWithRules(string text)
    {
        var normalized = text.ToLowerInvariant();
        var scored = CategoryKeywords
            .Select(pair => new
            {
                Category = pair.Key,
                Score = pair.Value.Count(keyword => normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            })
            .OrderByDescending(item => item.Score)
            .First();

        if (scored.Score == 0) return new ClassificationResult("General", 0.55);
        return new ClassificationResult(scored.Category, Math.Min(0.95, 0.65 + scored.Score * 0.10));
    }

    private static ClassificationResult? TryClassifyWithMlNet(string text)
    {
        try
        {
            lock (ModelLock)
            {
                categoryEngine ??= CreateCategoryEngine();
                if (categoryEngine is null) return null;

                var prediction = categoryEngine.Predict(new TicketInput { Text = text });
                if (string.IsNullOrWhiteSpace(prediction.Category)) return null;

                var confidence = prediction.Score.Length == 0 ? 0.70 : Math.Clamp(prediction.Score.Max(), 0.50f, 0.98f);
                return new ClassificationResult(prediction.Category, confidence);
            }
        }
        catch
        {
            return null;
        }
    }

    private static PredictionEngine<TicketInput, CategoryPrediction>? CreateCategoryEngine()
    {
        var modelPath = ResolvePath("ML", "category-fasttree-model.zip");
        var trainingPath = ResolvePath("ML", "training_data.csv");

        var dataChanged = ModelTrainer.EnsureCategoryTrainingData(trainingPath);
        if (dataChanged || !File.Exists(modelPath))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(modelPath)!);
            ModelTrainer.TrainCategoryModel(trainingPath, modelPath);
        }

        if (!File.Exists(modelPath)) return null;

        var context = new MLContext(seed: 11);
        var model = context.Model.Load(modelPath, out _);
        return context.Model.CreatePredictionEngine<TicketInput, CategoryPrediction>(model);
    }

    private static string ResolvePath(params string[] parts)
    {
        var fromWorkingDirectory = Path.Combine([Directory.GetCurrentDirectory(), "backend", .. parts]);
        if (File.Exists(fromWorkingDirectory) || Directory.Exists(Path.GetDirectoryName(fromWorkingDirectory))) return fromWorkingDirectory;
        return Path.Combine([Directory.GetCurrentDirectory(), .. parts]);
    }

    public static PriorityResult PredictPriority(string category, string text)
    {
        var mlResult = TryPredictPriorityWithMlNet(category, text);
        if (mlResult is not null) return mlResult;

        return PredictPriorityWithRules(category, text);
    }

    private static PriorityResult PredictPriorityWithRules(string category, string text)
    {
        var normalized = text.ToLowerInvariant();
        var urgencyHits = UrgencyKeywords.Count(keyword => normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase));
        var wordCount = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

        var priority = urgencyHits >= 2 ? Priorities.Critical :
            urgencyHits == 1 ? Priorities.High :
            category == "Technical" && wordCount > 20 ? Priorities.High :
            wordCount < 8 ? Priorities.Low :
            Priorities.Medium;

        var confidence = priority is Priorities.Critical or Priorities.High ? 0.86 : 0.78;
        return new PriorityResult(priority, confidence);
    }

    private static PriorityResult? TryPredictPriorityWithMlNet(string category, string text)
    {
        try
        {
            lock (ModelLock)
            {
                priorityEngine ??= CreatePriorityEngine();
                if (priorityEngine is null) return null;

                var normalized = text.ToLowerInvariant();
                var prediction = priorityEngine.Predict(new PriorityInput
                {
                    Category = category,
                    WordCount = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length,
                    HasUrgencyKeyword = UrgencyKeywords.Any(keyword => normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase)) ? 1 : 0
                });

                if (string.IsNullOrWhiteSpace(prediction.Priority)) return null;
                var confidence = prediction.Score.Length == 0 ? 0.75 : Math.Clamp(prediction.Score.Max(), 0.50f, 0.98f);
                return new PriorityResult(prediction.Priority, confidence);
            }
        }
        catch
        {
            return null;
        }
    }

    private static PredictionEngine<PriorityInput, PriorityPrediction>? CreatePriorityEngine()
    {
        var modelPath = ResolvePath("ML", "priority-fasttree-model.zip");
        var trainingPath = ResolvePath("ML", "priority_training_data.csv");

        var dataChanged = ModelTrainer.EnsurePriorityTrainingData(trainingPath);
        if (dataChanged || !File.Exists(modelPath))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(modelPath)!);
            ModelTrainer.TrainPriorityModel(trainingPath, modelPath);
        }

        if (!File.Exists(modelPath)) return null;

        var context = new MLContext(seed: 12);
        var model = context.Model.Load(modelPath, out _);
        return context.Model.CreatePredictionEngine<PriorityInput, PriorityPrediction>(model);
    }

    private sealed class TicketInput
    {
        public string Text { get; set; } = string.Empty;
    }

    private sealed class CategoryPrediction
    {
        [ColumnName("PredictedLabel")]
        public string Category { get; set; } = string.Empty;

        public float[] Score { get; set; } = [];
    }

    private sealed class PriorityInput
    {
        public string Category { get; set; } = string.Empty;
        public float WordCount { get; set; }
        public float HasUrgencyKeyword { get; set; }
    }

    private sealed class PriorityPrediction
    {
        [ColumnName("PredictedLabel")]
        public string Priority { get; set; } = string.Empty;

        public float[] Score { get; set; } = [];
    }
}
