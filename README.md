# JLPT Live Quiz

A real-time, multiplayer quiz application for practising Japanese Language Proficiency Test (JLPT) vocabulary. A host creates a room, players join with a nickname, and the game runs live — questions are pushed to all participants simultaneously, answers are scored by speed and accuracy, and a leaderboard is updated after each question.

---

## Demo

Coming soon.

---

## Features

- **User registration & login** with bcrypt-hashed passwords
- **JWT authentication** stored in HttpOnly cookies (7-day expiry)
- **Protected routes** on both the frontend and backend
- **Deck management** — create, read, update, and delete question decks scoped to the authenticated user; filterable by JLPT level (N5–N1)
- **Question management** — add, update, and delete four-choice multiple-choice questions within a deck
- **Live multiplayer game** over SignalR WebSockets
  - Host creates a room and receives a unique 6-character room code
  - Players join by entering the room code and a nickname (no account required)
  - Questions are broadcast simultaneously with a 20-second time limit
  - Scores are calculated from answer speed and a consecutive-correct-answer streak bonus
  - Live answer-count progress is pushed to all participants
  - Automatic question advancement when all players have answered
  - Host-disconnect detection terminates the game for all players
- **Game history** — completed games are persisted to the database with per-player scores and ranks; paginated history list and room-level detail view
- **Profile page** — shows the authenticated user's email, total deck count, and total hosted games
- **Automatic database migration** on startup
- **OpenAPI / Scalar API explorer** available in development mode

---

## Tech Stack

### Frontend
| Technology | Version |
|---|---|
| React | 19 |
| TypeScript | ~6.0 |
| React Router DOM | 7 |
| Vite | 8 |
| Tailwind CSS (via `@tailwindcss/vite`) | 4 |
| `@microsoft/signalr` | 10 |

### Backend
| Technology | Version |
|---|---|
| ASP.NET Core (Minimal API) | .NET 10 |
| Entity Framework Core | 10 |
| BCrypt.Net-Next | 4.2 |
| System.IdentityModel.Tokens.Jwt | 8 |
| Scalar.AspNetCore (API docs) | 2 |

### Database
- **PostgreSQL** via `Npgsql.EntityFrameworkCore.PostgreSQL`

### Realtime
- **ASP.NET Core SignalR** — hub mounted at `/gameHub`

### Authentication
- **JWT Bearer** tokens issued on login, read from an **HttpOnly cookie** (`jwt`) on every subsequent request. SignalR connections authenticate using the same HttpOnly JWT cookie (withCredentials: true). The backend reads the token from the cookie during negotiation.

### Deployment
- A **Dockerfile** exists for the backend (`src/JlptLiveQuiz.Api/Dockerfile`).
- No Docker Compose file is present in the repository.

---

## Architecture

### REST API flow

```
React (Vite + TypeScript)
         ↓  HTTP / fetch (credentials: "include")
ASP.NET Core Minimal API  (/api/*)
         ↓  Entity Framework Core
      PostgreSQL
```

### Realtime flow

```
React (Vite + TypeScript)
         ↓  @microsoft/signalr WebSocket
    ASP.NET Core SignalR
         ↓
       GameHub  (/gameHub)
         ↓  (in-memory RoomManager singleton)
    Room state (lobby → in-progress → finished)
         ↓  EF Core (on game end)
      PostgreSQL
```

---

## Screenshots

> _Screenshots not yet available. Placeholder sections are provided below._

### Landing Page
_Coming soon_

### Login
_Coming soon_

### Host
_Coming soon_

### Player
_Coming soon_

### Deck Management
_Coming soon_

### Question Management
_Coming soon_

### History
_Coming soon_

### Profile
_Coming soon_

---

## Folder Structure

```
JlptLiveQuiz/
├── JlptLiveQuiz.slnx          # Solution file
├── client/                     # React + Vite frontend
│   ├── .env                    # Frontend environment variables
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig*.json
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # Router + app shell
│       ├── index.css
│       ├── components/
│       │   └── ProtectedRoute.tsx
│       ├── pages/
│       │   ├── AuthPage.tsx
│       │   ├── DeckManagementPage.tsx
│       │   ├── HistoryPage.tsx
│       │   ├── HostPage.tsx
│       │   ├── PlayerPage.tsx
│       │   ├── ProfilePage.tsx
│       │   └── QuestionManagementPage.tsx
│       └── services/
│           ├── apiClient.ts
│           ├── authService.ts
│           ├── deckService.ts
│           ├── historyService.ts
│           ├── questionService.ts
│           └── signalrService.ts
└── src/
    └── JlptLiveQuiz.Api/       # ASP.NET Core backend
        ├── Dockerfile
        ├── JlptLiveQuiz.Api.csproj
        ├── Program.cs
        ├── AppDbContext.cs
        ├── RoomManager.cs      # In-memory singleton room registry
        ├── RoomState.cs        # Room, player, and answer state classes
        ├── appsettings.json
        ├── appsettings.Development.json
        ├── appsettings.Production.json
        ├── Dtos/
        │   ├── AuthDtos.cs
        │   ├── DeckDtos.cs
        │   ├── HistoryDtos.cs
        │   └── QuestionDtos.cs
        ├── Endpoints/
        │   ├── AuthEndpoints.cs
        │   ├── DeckEndpoints.cs
        │   ├── HistoryEndpoints.cs
        │   └── QuestionEndpoints.cs
        ├── Hubs/
        │   └── GameHub.cs
        ├── Migrations/
        └── Models/
            ├── Deck.cs
            ├── GameHistory.cs
            ├── Question.cs
            └── User.cs
```

---

## API Overview

All REST endpoints are prefixed with `/api`. All endpoints except `POST /api/auth/register` and `POST /api/auth/login` require a valid JWT (sent automatically via the `jwt` HttpOnly cookie).

### Authentication — `/api/auth`
| Method | Path | Auth required | Description |
|--------|------|:---:|---|
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate and receive a JWT cookie |
| `POST` | `/api/auth/logout` | No | Clear the JWT cookie |
| `GET` | `/api/auth/profile` | Yes | Return the current user's id, email, deck count, and hosted game count |

### Deck Management — `/api/decks`
| Method | Path | Description |
|--------|------|---|
| `GET` | `/api/decks` | List all decks owned by the current user (optional `?level=N5…N1` filter) |
| `GET` | `/api/decks/{id}` | Get a single deck with its questions |
| `POST` | `/api/decks` | Create a new deck |
| `PUT` | `/api/decks/{id}` | Update deck name and level |
| `DELETE` | `/api/decks/{id}` | Delete a deck |

### Question Management — nested under decks / `/api/questions`
| Method | Path | Description |
|--------|------|---|
| `POST` | `/api/decks/{deckId}/questions` | Add a question to a deck |
| `PUT` | `/api/questions/{id}` | Update an existing question |
| `DELETE` | `/api/questions/{id}` | Delete a question |

### History — `/api/history`
| Method | Path | Description |
|--------|------|---|
| `GET` | `/api/history` | List past games (paginated, 10 per page, `?page=N`) |
| `GET` | `/api/history/{roomCode}` | Get detailed results for a specific game |

### Realtime Game — SignalR at `/gameHub`

The hub exposes the following **invokable methods** (client → server):

| Method | Caller | Description |
|--------|--------|---|
| `CreateRoom(deckId)` | Host | Create a new lobby and receive the room code |
| `JoinRoom(roomCode, nickname)` | Player | Join an existing lobby |
| `StartGame(roomCode)` | Host | Load questions and begin the game |
| `SubmitAnswer(roomCode, questionId, selectedIndex)` | Player | Submit an answer for the current question |
| `NextQuestion(roomCode)` | Host | Advance to the next question (or end game) |

The server broadcasts the following **events** (server → client):

| Event | Sent to | Payload |
|-------|---------|---|
| `RoomCreated` | Host | `roomCode: string` |
| `PlayerJoined` | All in room | `players: string[]` (all current nicknames) |
| `QuestionStarted` | All in room | question id, term, choices, index, total, timeLimit |
| `PlayerAnswered` | All in room | `answeredCount`, `totalPlayers` |
| `QuestionEnded` | All in room | `correctIndex`, `leaderboard[]` |
| `GameEnded` | All in room | final `leaderboard[]` |
| `ErrorOccurred` | Caller / all | Error message string |
| `PlayerLeft` | All in room | `connectionId` of departed player |

---

## Authentication

1. **Registration** — the client `POST`s email + password to `/api/auth/register`. The password is hashed with BCrypt before being stored.
2. **Login** — the client `POST`s credentials. On success the server signs a JWT (HMAC-SHA256, 7-day expiry, claims: `NameIdentifier` = user id, `Email`) and writes it to an `HttpOnly; Secure; SameSite=None` cookie named `jwt`.
3. **Request authentication** — every subsequent API request automatically sends the `jwt` cookie. The backend reads it in `JwtBearerEvents.OnMessageReceived` and sets the token context.
4. SignalR authentication — SignalR uses the same HttpOnly JWT cookie as the REST API (`withCredentials: true`). The backend reads the token from the cookie during negotiation.
5. **Protected routes** — `ProtectedRoute.tsx` calls `GET /api/history` as a liveness probe: a `401` response means the user is not authenticated and they are redirected to `/login`. Host, History, Decks, Questions, and Profile pages are all protected.
6. **Authorization** — deck and history endpoints verify that the resource belongs to the currently authenticated user; unauthorized access returns `403 Forbidden`.

---

## Realtime Flow

```
Host authenticates
       ↓
 CreateRoom(deckId)
       ↓  [server: creates in-memory RoomState, returns 6-char code]
Host receives RoomCreated(roomCode)
       ↓
Players call JoinRoom(roomCode, nickname)
       ↓  [server: adds PlayerState, broadcasts PlayerJoined]
All clients see updated player list
       ↓
Host calls StartGame(roomCode)
       ↓  [server: loads questions from DB, sets status = InProgress]
Server broadcasts QuestionStarted (term, choices, 20s limit)
       ↓
Players call SubmitAnswer(roomCode, questionId, selectedIndex)
       ↓  [server: scores answer = speed × 1000 + streak bonus × 50, thread-safe lock]
Server broadcasts PlayerAnswered (answered count)
       ↓  [when all players have answered OR host calls NextQuestion]
Server broadcasts QuestionEnded (correctIndex, leaderboard)
       ↓
Host calls NextQuestion(roomCode)  [repeat per question]
       ↓  [on last question]
Server persists GameHistory + PlayerResults to PostgreSQL
Server broadcasts GameEnded (final leaderboard)
       ↓
History is viewable via GET /api/history
```

---

## Database

| Entity | Table | Description |
|--------|-------|---|
| `User` | `Users` | Registered user account — stores email, bcrypt password hash, and creation timestamp |
| `Deck` | `Decks` | A named collection of questions associated with a JLPT level (N5–N1) and owned by a `User` |
| `Question` | `Questions` | A single multiple-choice question belonging to a `Deck` — stores term, four choices (A–D), and the index of the correct choice |
| `GameHistory` | `GameHistories` | A record of a completed game session — stores room code, linked deck id, host user id, timestamp, and total question count |
| `PlayerResult` | `PlayerResults` | Final score and rank of one player within a `GameHistory` — stores nickname, total score, and rank |

Migrations are applied automatically at application startup via `db.Database.Migrate()`.

---

## Environment Variables

### Backend

Configuration is provided through `appsettings.json` and environment variables / user secrets. The following keys are read by the application:

| Key | Where used | Description |
|-----|-----------|---|
| `ConnectionStrings__DefaultConnection` | `Program.cs` | PostgreSQL connection string |
| `Jwt__Key` | `AuthEndpoints.cs`, `Program.cs` | HMAC-SHA256 signing secret for JWT |
| `Jwt__Issuer` | `AuthEndpoints.cs`, `Program.cs` | JWT issuer claim |
| `Jwt__Audience` | `AuthEndpoints.cs`, `Program.cs` | JWT audience claim |
| `AllowedOrigins` | `Program.cs` | Comma-separated allowed CORS origins (default: `http://localhost:5173`) |

> **Note:** None of these values are committed to source control. Provide them via environment variables, Docker secrets, or .NET user secrets (`dotnet user-secrets`).

### Frontend

Defined in `client/.env` (Vite convention — all variables must be prefixed `VITE_`):

| Variable | Default value | Description |
|----------|--------------|---|
| `VITE_API_URL` | `http://localhost:5296` | Base URL of the ASP.NET Core backend |
| `VITE_SIGNALR_URL` | `http://localhost:5296/gameHub` | Full URL of the SignalR hub endpoint |

---

## Local Development

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- A running PostgreSQL instance

### Backend

```bash
cd src/JlptLiveQuiz.Api

# Restore NuGet packages
dotnet restore

# Supply secrets (once)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=jlptquiz;Username=postgres;Password=yourpassword"
dotnet user-secrets set "Jwt:Key" "your-secret-key-at-least-32-chars"
dotnet user-secrets set "Jwt:Issuer" "JlptLiveQuiz"
dotnet user-secrets set "Jwt:Audience" "JlptLiveQuizUsers"

# Migrations are applied automatically on startup, but you can also run manually:
dotnet ef database update

# Start the development server
dotnet run
```

The API will be available at `http://localhost:5296` by default.  
The Scalar API explorer is available at `http://localhost:5296/scalar/v1` in development.

### Frontend

```bash
cd client

# Install dependencies
npm install

# Copy and edit the environment file
cp .env .env.local   # optional — edit VITE_API_URL / VITE_SIGNALR_URL as needed

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:5173` by default.

---

## Production Build

### Backend

```bash
cd src/JlptLiveQuiz.Api
dotnet publish -c Release -o ./publish
```

The published output can be run with:

```bash
dotnet ./publish/JlptQuiz.Api.dll
```

### Frontend

```bash
cd client
npm run build
```

Static files are output to `client/dist/` and can be served by any static file host or reverse proxy (e.g. nginx).

---

## Deployment

### Backend Docker image

A `Dockerfile` exists at `src/JlptLiveQuiz.Api/Dockerfile`. It uses a multi-stage build:

```dockerfile
# Build stage  —  mcr.microsoft.com/dotnet/sdk:10.0
dotnet restore → dotnet publish -c Release

# Runtime stage — mcr.microsoft.com/dotnet/aspnet:10.0
EXPOSE 8080
ENTRYPOINT ["dotnet", "JlptQuiz.Api.dll"]
```

Build and run the image:

```bash
docker build -t jlptquiz-api ./src/JlptLiveQuiz.Api

docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=db;Database=jlptquiz;Username=postgres;Password=yourpassword" \
  -e Jwt__Key="your-secret-key" \
  -e Jwt__Issuer="JlptLiveQuiz" \
  -e Jwt__Audience="JlptLiveQuizUsers" \
  -e AllowedOrigins="https://your-frontend-domain.com" \
  jlptquiz-api
```

**Docker Compose configuration not found.** No `docker-compose.yml` exists in the repository; you will need to create one to orchestrate the API container together with a PostgreSQL container.

---

## Security

The following security measures are implemented in the source code:

| Measure | Detail |
|---------|--------|
| **Password hashing** | BCrypt (via BCrypt.Net-Next v4.2) — passwords are never stored in plain text |
| **JWT signing** | HMAC-SHA256 with a configurable symmetric key; issuer, audience, and lifetime are all validated |
| **HttpOnly cookie** | The JWT is stored in `HttpOnly; Secure; SameSite=None` cookie — not accessible from JavaScript |
| **CORS policy** | Named `ReactClient` policy; only explicitly configured origins are allowed; credentials are permitted |
| **Resource ownership checks** | Deck and history endpoints compare the resource's `UserId` against the authenticated user's claim before allowing read/write/delete |
| **Authorization middleware** | `UseAuthentication()` and `UseAuthorization()` are registered; all non-auth endpoints are decorated with `RequireAuthorization()` |
| **Thread-safe answer submission** | The `SubmitAnswer` path uses a `lock` on `room.Lock` to prevent race conditions when multiple players answer simultaneously |

---

## Future Improvements

The following features are **not present** in the current codebase:

- **Docker Compose file** for local multi-container orchestration (API + PostgreSQL)
- **Refresh token** support — the current JWT has a 7-day fixed expiry with no silent renewal
- **Time-based question auto-advance** — the 20-second timer is enforced client-side only; the server does not enforce it; a player can wait indefinitely without submitting
- **Player reconnection** — a disconnected player loses their in-game state permanently (no reconnection token / resume logic)
- **Admin / deck sharing** — decks are strictly private to the owning user; no public or shared deck support
- **Image or audio questions** — questions support text (term) and text choices only
- **Rate limiting** on auth endpoints

---

## License

MIT