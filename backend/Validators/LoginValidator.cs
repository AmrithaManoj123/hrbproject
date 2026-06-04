using FluentValidation;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Valid email is required");
        RuleFor(request => request.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
