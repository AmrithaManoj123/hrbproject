using FluentValidation;

public class CreateTicketRequestValidator : AbstractValidator<CreateTicketRequest>
{
    public CreateTicketRequestValidator()
    {
        RuleFor(request => request.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must be 200 characters or fewer");
        RuleFor(request => request.Description)
            .NotEmpty().WithMessage("Description is required")
            .MinimumLength(10).WithMessage("Description must be at least 10 characters");
    }
}
