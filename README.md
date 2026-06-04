# AI Customer Support Triage Platform

This workspace contains a from-scratch implementation of the project described in `Amritha.pdf`.

## Project Status

The project is implemented as a runnable full-stack prototype:

- Local ASP.NET Core API at `http://localhost:5000/api`
- Angular 19 frontend at `http://localhost:4200`
- Swagger UI at `http://localhost:5000/swagger`
- Self-issued HS256 JWT auth
- BCrypt password hashing
- FluentValidation request validation
- Serilog structured console logging
- IMemoryCache-backed dashboard responses
- Seeded users, teams, categories, and team membership
- Ticket submission
- ML.NET FastTree-backed category classification with rule fallback
- Priority prediction
- Automatic assignment and SLA calculation
- Ticket list/detail/status/priority/category/assignment APIs
- Comments
- File attachments
- Dashboard stats and agent workload APIs
- Team and category management endpoints
- EF Core SQL Server context and seed bootstrap
- Hangfire background-job dashboard wiring

By default, `Features:UseSqlServer` and `Features:UseHangfire` are `false` in `backend/appsettings.json` so the app still runs without Docker. Turn both on after SQL Server is running on `localhost:1433`.

For a detailed backend architecture and file-by-file explanation, see `backend/BACKEND.md`.

## Seed Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@company.com` | `Admin123!` |
| Agent | `finance.lead@company.com` | `Agent123!` |
| Agent | `finance.agent@company.com` | `Agent123!` |
| Agent | `engineering.lead@company.com` | `Agent123!` |
| Agent | `support.lead@company.com` | `Agent123!` |
| Agent | `support.agent@company.com` | `Agent123!` |
| Customer | `amrithamanoj@gmail.com` | `password12345678` |

Registered users are created as `customer`.

## Run Backend

```powershell
dotnet run --project backend\Backend.csproj
```

Open:

- API root: `http://localhost:5000`
- OpenAPI JSON: `http://localhost:5000/openapi/v1.json`
- Swagger UI: `http://localhost:5000/swagger`
- Hangfire Dashboard: `http://localhost:5000/hangfire` when `Features:UseHangfire` is `true`

## Run Frontend

```powershell
cd frontend
npm start
```

Open `http://localhost:4200/login`.

## Optional OpenRouter AI Replies

The agent/admin ticket detail page includes an **AI Suggested Reply** button. It calls Gemini 2.5 Flash through OpenRouter from the backend, so the API key is not exposed in Angular.

Set your key before starting the backend:

```powershell
$env:OPENROUTER_API_KEY = "your-openrouter-key"
dotnet run --project backend\Backend.csproj
```

The default model is `google/gemini-2.5-flash` in `backend/appsettings.json`.

## Run SQL Server And Hangfire

Docker Desktop is required for this step.

```powershell
docker compose up -d
```

Then set these flags in `backend/appsettings.json`:

```json
{
  "Features": {
    "UseSqlServer": true,
    "UseHangfire": true
  }
}
```

Start the backend again. The app creates and seeds the SQL Server schema automatically.

## Quick API Walkthrough

Register a customer:

```powershell
Invoke-RestMethod -Method Post http://localhost:5000/api/auth/register `
  -ContentType 'application/json' `
  -Body '{"fullName":"John Doe","email":"john@example.com","password":"Pass123!"}'
```

Login:

```powershell
$login = Invoke-RestMethod -Method Post http://localhost:5000/api/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"john@example.com","password":"Pass123!"}'
$token = $login.token
```

Create a ticket:

```powershell
Invoke-RestMethod -Method Post http://localhost:5000/api/tickets `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType 'application/json' `
  -Body '{"title":"Payment failed","description":"I was charged twice for my order and need a refund"}'
```

List tickets:

```powershell
Invoke-RestMethod http://localhost:5000/api/tickets `
  -Headers @{ Authorization = "Bearer $token" }
```

## Notes

The backend currently targets `.NET 10` because this workspace has the .NET 10 SDK installed. If the PDF must be matched exactly, retarget `backend/Backend.csproj` to `net8.0` on a machine with the .NET 8 SDK.
