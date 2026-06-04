using Microsoft.ML;
using Microsoft.ML.Data;

public static class ModelTrainer
{
    private const int MinimumTrainingRows = 500;

    public static bool EnsureCategoryTrainingData(string trainingCsvPath)
    {
        if (CountDataRows(trainingCsvPath) >= MinimumTrainingRows) return false;

        Directory.CreateDirectory(Path.GetDirectoryName(trainingCsvPath)!);
        File.WriteAllLines(trainingCsvPath, BuildCategoryRows());
        return true;
    }

    public static bool EnsurePriorityTrainingData(string trainingCsvPath)
    {
        if (CountDataRows(trainingCsvPath) >= MinimumTrainingRows) return false;

        Directory.CreateDirectory(Path.GetDirectoryName(trainingCsvPath)!);
        File.WriteAllLines(trainingCsvPath, BuildPriorityRows());
        return true;
    }

    public static void TrainCategoryModel(string trainingCsvPath, string modelOutputPath)
    {
        var context = new MLContext(seed: 11);
        var data = context.Data.LoadFromTextFile<TicketTrainingRow>(
            trainingCsvPath,
            hasHeader: true,
            separatorChar: ',');

        var pipeline = context.Transforms.Conversion.MapValueToKey("Label", nameof(TicketTrainingRow.Category))
            .Append(context.Transforms.Text.FeaturizeText("Features", nameof(TicketTrainingRow.Text)))
            .Append(context.MulticlassClassification.Trainers.OneVersusAll(
                context.BinaryClassification.Trainers.FastTree(
                    labelColumnName: "Label",
                    featureColumnName: "Features",
                    numberOfLeaves: 8,
                    numberOfTrees: 60,
                    minimumExampleCountPerLeaf: 1),
                labelColumnName: "Label"))
            .Append(context.Transforms.Conversion.MapKeyToValue("PredictedLabel"));

        var model = pipeline.Fit(data);
        context.Model.Save(model, data.Schema, modelOutputPath);
    }

    public static void TrainPriorityModel(string trainingCsvPath, string modelOutputPath)
    {
        var context = new MLContext(seed: 12);
        var data = context.Data.LoadFromTextFile<PriorityTrainingRow>(
            trainingCsvPath,
            hasHeader: true,
            separatorChar: ',');

        var pipeline = context.Transforms.Conversion.MapValueToKey("Label", nameof(PriorityTrainingRow.Priority))
            .Append(context.Transforms.Categorical.OneHotEncoding("CategoryFeatures", nameof(PriorityTrainingRow.Category)))
            .Append(context.Transforms.Concatenate("Features", "CategoryFeatures", nameof(PriorityTrainingRow.WordCount), nameof(PriorityTrainingRow.HasUrgencyKeyword)))
            .Append(context.MulticlassClassification.Trainers.OneVersusAll(
                context.BinaryClassification.Trainers.FastTree(
                    labelColumnName: "Label",
                    featureColumnName: "Features",
                    numberOfLeaves: 8,
                    numberOfTrees: 60,
                    minimumExampleCountPerLeaf: 1),
                labelColumnName: "Label"))
            .Append(context.Transforms.Conversion.MapKeyToValue("PredictedLabel"));

        var model = pipeline.Fit(data);
        context.Model.Save(model, data.Schema, modelOutputPath);
    }

    private sealed class TicketTrainingRow
    {
        [LoadColumn(0)]
        public string Text { get; set; } = string.Empty;

        [LoadColumn(1)]
        public string Category { get; set; } = string.Empty;
    }

    private sealed class PriorityTrainingRow
    {
        [LoadColumn(0)]
        public string Category { get; set; } = string.Empty;

        [LoadColumn(1)]
        public float WordCount { get; set; }

        [LoadColumn(2)]
        public float HasUrgencyKeyword { get; set; }

        [LoadColumn(3)]
        public string Priority { get; set; } = string.Empty;
    }

    private static int CountDataRows(string path) => File.Exists(path) ? Math.Max(0, File.ReadLines(path).Count() - 1) : 0;

    private static IEnumerable<string> BuildCategoryRows()
    {
        yield return "Text,Category";
        var examples = new Dictionary<string, string[]>
        {
            ["Billing"] = [
                "I need a refund for order {0}",
                "Payment failed and I was charged twice",
                "Invoice has the wrong amount",
                "My card was billed after cancellation",
                "The paid plan price looks incorrect"
            ],
            ["Technical"] = [
                "App crashes when I click export button",
                "The website is down and showing an error",
                "Login failed with a server bug",
                "The page is slow and broken",
                "Export feature crashed immediately"
            ],
            ["Account"] = [
                "Cannot reset my password",
                "My account is locked",
                "I need to update my email profile",
                "Sign in keeps rejecting my password",
                "Account verification link expired"
            ],
            ["Feature Request"] = [
                "Please add dark mode",
                "I want a feature to export reports",
                "Please improve the dashboard filters",
                "Can you add bulk ticket actions",
                "Feature request for custom notifications"
            ],
            ["General"] = [
                "What are your business hours",
                "How can I contact support",
                "I have a question about your service",
                "Please send me more information",
                "Where can I find help documentation"
            ]
        };

        for (var i = 0; i < MinimumTrainingRows; i++)
        {
            var category = examples.Keys.ElementAt(i % examples.Count);
            var template = examples[category][i / examples.Count % examples[category].Length];
            yield return $"\"{string.Format(template, 4500 + i)}\",{category}";
        }
    }

    private static IEnumerable<string> BuildPriorityRows()
    {
        yield return "Category,WordCount,HasUrgencyKeyword,Priority";
        var categories = new[] { "Billing", "Technical", "Account", "Feature Request", "General" };
        for (var i = 0; i < MinimumTrainingRows; i++)
        {
            var category = categories[i % categories.Length];
            var wordCount = 6 + i % 48;
            var urgency = i % 4 == 0 ? 1 : 0;
            var priority = urgency == 1 && i % 8 == 0 ? Priorities.Critical :
                urgency == 1 ? Priorities.High :
                category == "Technical" && wordCount > 24 ? Priorities.High :
                wordCount < 10 ? Priorities.Low :
                Priorities.Medium;
            yield return $"{category},{wordCount},{urgency},{priority}";
        }
    }
}
