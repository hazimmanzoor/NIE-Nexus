# NIE Nexus

NIE Nexus is a college event management web app for students, organizers, workers, and administrators. It brings event discovery, registrations, staff workflows, and event planning guidance together in one place.
NIE Nexus is a college event management web app for students, organizers, workers, and administrators. It brings event discovery, registrations, team workflows, and event planning guidance together in one place.

## Features

- Student sign-up and sign-in
- Browse and register for campus events
- Organizer and administrator event workflows
- Worker assignments and event information
- Specialist workspaces for venue, budget, scheduling, participants, and communication
- Local SQLite database for application data

## Requirements

- Node.js 26 or later
- npm

## Getting started

1. Clone the repository:

   ```bash
   git clone https://github.com/hazimmanzoor/NIE-Nexus.git
   cd NIE-Nexus
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set a long, random `SESSION_SECRET` value.
4. Start the app:

   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

The app creates a local `nie-nexus.db` SQLite database when it starts.

## Demo login accounts

On a fresh installation, the app seeds demo accounts for each role. Select the matching role on the sign-in screen, then use one of these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin1@demo.test` | `Campus123!` |
| Organizer | `organizer1@demo.test` | `Campus123!` |
| Worker | `worker1@demo.test` | `Campus123!` |
| Student | `student1@demo.test` | `Campus123!` |

These credentials are for local demonstration only. The sample accounts are seeded only when the database has no users. If you use an existing database, these accounts may not be available. Never use these demo credentials for a real deployment.

## Running tests

```bash
npm test
```

## Project structure

- `server.js` — Express server, routes, and database setup
- `public/` — web interface, styles, and images
- `knowledge/` — specialist knowledge files
- `tests/` — automated tests
- `specialist-engine.js` — specialist question matching and responses
- `specialist-service.js` — specialist conversations and event context

## Configuration and data

Keep `.env` and your local database private. They are excluded from Git. Use `.env.example` as the configuration template. Each installation creates and uses its own local database.

## License

No license has been added. Contact the repository owner before reusing or distributing this project.
