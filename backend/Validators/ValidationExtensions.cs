using FluentValidation.Results;

public static class ValidationExtensions
{
    public static List<ValidationError> ToValidationErrors(this ValidationResult result) =>
        result.Errors
            .Select(error => new ValidationError(ToCamelCase(error.PropertyName), error.ErrorMessage))
            .ToList();

    private static string ToCamelCase(string value) =>
        string.IsNullOrWhiteSpace(value) ? value : char.ToLowerInvariant(value[0]) + value[1..];
}
