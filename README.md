# Voting Information Management System

A complete production-ready system with React frontend, ASP.NET Core 9 API, and SQL Server.

---

## Project Structure

```
d:\New folder\
├── village-info/          # React 19 + Vite + TypeScript frontend
├── VotingInfo.API/        # ASP.NET Core 9 Web API
├── VotingInfo.Application/ # DTOs, Interfaces
├── VotingInfo.Domain/     # Entities, Constants
├── VotingInfo.Infrastructure/ # EF Core, Services
└── VotingInfo.sln
```

---

## Prerequisites

- Node.js 22+
- .NET 9 SDK
- SQL Server (LocalDB or full instance)

---

## 1. Database Setup

### Update connection string in `VotingInfo.API/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=VotingInfoDb_Dev;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### Run migrations:
```bash
cd "d:\New folder"
dotnet ef database update --project VotingInfo.Infrastructure --startup-project VotingInfo.API
```

The database is automatically seeded on first run with:
- Super Admin user
- 10 sample wards
- 4 interest options
- Default content items

---

## 2. Backend Setup

```bash
cd "d:\New folder\VotingInfo.API"
dotnet run
```

API runs at: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/swagger`

### Environment Variables (Production)
Set these as environment variables or in `appsettings.Production.json`:

| Key | Description |
|-----|-------------|
| `ConnectionStrings__DefaultConnection` | SQL Server connection string |
| `Jwt__Secret` | JWT signing secret (min 32 chars) |
| `Jwt__Issuer` | JWT issuer |
| `Jwt__Audience` | JWT audience |
| `Cors__Origins` | Comma-separated allowed origins |
| `FileStorage__BasePath` | Local path for uploaded files |
| `FileStorage__BaseUrl` | Public URL prefix for files |

---

## 3. Frontend Setup

```bash
cd "d:\New folder\village-info"
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Files

`.env.development`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

`.env.production`:
```
VITE_API_BASE_URL=https://your-api-domain.com/api
```

---

## 4. Default Login

| Field | Value |
|-------|-------|
| Username | `superadmin` |
| Password | `Admin@123` |
| Role | Super Admin |

**Change this password immediately after first login.**

---

## 5. User Roles & Permissions

| Role | Permissions |
|------|-------------|
| SuperAdmin | Full access to everything |
| Admin | View/export voters in assigned wards, manage Ward Admins |
| WardAdmin | View/export voters in their single assigned ward only |

### Ward-Level Security
Ward authorization is enforced at the **database query level** in `VoterService`. Even if a Ward Admin manually sends `wardId=OtherWard` in the API request, the query filter ensures they only see their own ward's data.

---

## 6. Excel Import Format

The Excel file should have these columns (row 1 = headers):

| Col | Field |
|-----|-------|
| A | EPIC Number (required) |
| B | Full Name Hindi (required) |
| C | Full Name English |
| D | Father/Husband Name Hindi |
| E | Gender (Male/Female/Other, required) |
| F | Age |
| G | Mobile Number |
| H | House Number |
| I | Address Hindi |
| J | Booth Number |
| K | Booth Name |
| L | Serial Number |
| M | Area |

**Import Modes:**
- `InsertOnly` — duplicates (same EPIC) are rejected
- `Upsert` — existing voters are updated, new ones inserted

---

## 7. OTP Configuration

OTP is currently logged to console (`ConsoleSmsService`). To use a real SMS provider:

1. Implement `ISmsService` in `VotingInfo.Infrastructure/Services/`
2. Register it in `DependencyInjection.cs` replacing `ConsoleSmsService`
3. Add SMS API credentials to `appsettings.json`

OTP settings:
- 6 digits, expires in 5 minutes
- Max 5 verification attempts
- Max 3 resend requests
- 60-second cooldown between resends

---

## 8. Public Website

Accessible at `/` without login.

- Default language: **Hindi**
- Language toggle: Hindi ↔ English (persisted in localStorage)
- Interest popup appears **once** after 10 seconds on first visit
- Sticky "अपनी पसंद बताएं" button always available
- Popup never auto-repeats after being shown/submitted

---

## 9. API Endpoints Summary

### Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`

### Users
- `GET/POST /api/users`
- `GET/PUT /api/users/{id}`
- `PATCH /api/users/{id}/status`
- `POST /api/users/{id}/reset-password`

### Wards
- `GET/POST /api/wards`
- `GET/PUT /api/wards/{id}`
- `PATCH /api/wards/{id}/status`

### Voters
- `GET /api/voters` (server-side pagination + filters)
- `GET /api/voters/export`
- `POST /api/voters/import/preview`
- `POST /api/voters/import/{id}/confirm`
- `GET /api/voters/import/{id}/errors`

### Public (no auth)
- `GET /api/public/interest-options`
- `GET /api/public/content`
- `GET /api/public/gallery`
- `POST /api/public/interests`
- `POST /api/public/otp/send`
- `POST /api/public/otp/verify`

### Reports
- `GET /api/reports/dashboard`
- `GET /api/reports/public-interests`
- `GET /api/reports/public-interests/export`

---

## 10. Production Deployment

### Backend
```bash
cd "d:\New folder\VotingInfo.API"
dotnet publish -c Release -o ./publish
```

### Frontend
```bash
cd "d:\New folder\village-info"
npm run build
# Deploy dist/ folder to web server
```

### Database
```bash
dotnet ef database update --project VotingInfo.Infrastructure --startup-project VotingInfo.API
```

---

## 11. Security Notes

- JWT tokens expire in 60 minutes (configurable)
- Refresh tokens expire in 7 days with rotation
- Passwords hashed with BCrypt (work factor 11)
- OTP stored as SHA-256 hash, never plain text
- Rate limiting: 5 OTP requests/min, 10 logins/5min
- Mobile numbers masked by default in reports
- Ward-level authorization enforced at DB query level
- CORS restricted to configured origins
- Global exception middleware prevents stack trace exposure

---

## 12. Translation Files

- Hindi: `src/locales/hi/translation.json`
- English: `src/locales/en/translation.json`

Add new keys to both files. Use `t('key')` in components.
