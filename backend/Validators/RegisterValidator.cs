using FluentValidation;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(request => request.FullName)
            .NotEmpty().WithMessage("Full name is required")
            .MaximumLength(120).WithMessage("Full name must be 120 characters or fewer");
        RuleFor(request => request.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Valid email is required")
            .MaximumLength(180).WithMessage("Email must be 180 characters or fewer");
        RuleFor(request => request.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters");
    }
}
