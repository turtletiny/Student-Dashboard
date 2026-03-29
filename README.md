

A cozy student dashboard web app inspired by a warm, bookish aesthetic.

## Features

- To-do list with completion tracking
- Daily habits with streak calculation
- Study schedule planner and calendar view
- Subject tabs with notes and resource links
- Google Calendar sync for fetching events and pushing today's study sessions

## Run

This project uses plain HTML, CSS, and JavaScript.

JavaScript is split into focused files under `js/` (`app-core.js`, `app-ui.js`, `app-events.js`, `app-google.js`, `app-sync.js`, and `main.js`) for easier maintenance.

1. Open `index.html` in your browser.
2. For best Google OAuth compatibility, serve it via a local HTTP server.

Example with Python:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Google Calendar Setup

1. Create a project in Google Cloud Console.
2. Enable **Google Calendar API**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Add your local origin (for example `http://localhost:5500`) to authorized JavaScript origins.
5. Create an API key.
6. Copy `config.example.js` to `config.local.js` and fill in your values.
7. `config.local.js` is ignored by Git, so your keys stay private.

Example:

```js
window.APP_CONFIG = {
  google: {
    clientId: "YOUR_GOOGLE_OAUTH_CLIENT_ID",
    apiKey: "YOUR_GOOGLE_API_KEY",
    calendarId: "primary"
  }
};
```

## Data Storage

By default, dashboard data is stored locally in your browser using `localStorage`.

For multi-device use, enable Supabase cloud sync:

1. Create a project at https://supabase.com.
2. In the SQL editor, create a table for dashboard sync:

```sql
create table if not exists dashboard_state (
  id text primary key,
  updated_at bigint not null,
  data jsonb not null
);
```

3. Enable Row Level Security and add a policy that allows your intended access pattern (for personal use, you can allow public read/write with anon key, but keep keys private).
4. Copy your project URL and anon key from Supabase project settings.
5. In `config.local.js`, set `window.APP_CONFIG.supabase`.

Example:

```js
window.APP_CONFIG = {
  supabase: {
    url: "https://YOUR_PROJECT_ID.supabase.co",
    anonKey: "YOUR_SUPABASE_ANON_KEY",
    table: "dashboard_state",
    rowId: "personal"
  }
};
```
