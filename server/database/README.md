# Dealership database service

Coursework Express/Mongoose API, used by the Django/React capstone. Startup now waits for MongoDB and **does not delete, replace or seed records**. Route paths and JSON responses are unchanged.

## Local development

Use Node 22 and an isolated MongoDB database. Install dependencies with `npm install`, then set `MONGODB_URI` (default `mongodb://mongo_db:27017/`) and optionally `MONGODB_DATABASE` (default `dealershipsDB`), and run `npm start`. A failed database connection prevents the HTTP listener from starting. The default hostname is intended for the provided Compose network; use `mongodb://127.0.0.1:27017/` for a local MongoDB instance.

To add the bundled sample fixtures to a **development-only** database:

```sh
ALLOW_DEVELOPMENT_SEED=1 npm run seed:dev
```

The seed command uses `data/*.json` relative to its own file, inserts missing numeric IDs, and leaves existing fields untouched. Run it once at a time; this is not a migration, backup or concurrent seeding tool. Errors can leave partially inserted fixtures; rerunning inserts only remaining IDs. Never run it against production. Starting/restarting the API no longer loads sample data automatically.

## Offline tests

```sh
npm test
node --check app.js
node --check seed.js
```

The Node test runner executes the real startup code with database/server modules replaced, and the real seeding function with an in-memory adapter. It checks import side effects, startup ordering/failure, absence of destructive operations, preservation of existing records and error propagation. No external database or user data is used. These tests do not establish MongoDB integration or full-stack readiness.

## Remaining limitations

This teaching service is not ready for public deployment: review creation has no authentication and its existing maximum-ID allocation is not safe for concurrent writers. The bundled Compose configuration publishes an unauthenticated MongoDB port; use only an isolated development environment. Database indexing, migrations, authentication and deployment hardening require a separate reviewed change. No real database was changed while testing the startup fix.
