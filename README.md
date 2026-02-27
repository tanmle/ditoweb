# Instat DITO Web

Web app for DITO team management (match registration, set team, penalties, finance, and user profile), migrated to Next.js.

## Tech Stack

- Next.js 16 (Pages Router)
- React 19
- Firebase (Auth, Realtime Database, Storage)
- Redux
- Bootstrap-based legacy UI (`public/css/sb-admin-2.css`)

## Requirements

- Node.js 20+
- npm 10+

## Environment Variables

Create `.env` in project root.

The app supports both legacy `REACT_APP_*` and Next.js `NEXT_PUBLIC_*` names.
Use `NEXT_PUBLIC_*` for new setups.

```env
NEXT_PUBLIC_apiKey=
NEXT_PUBLIC_authDomain=
NEXT_PUBLIC_databaseURL=
NEXT_PUBLIC_projectId=
NEXT_PUBLIC_storageBucket=
NEXT_PUBLIC_messagingSenderId=
NEXT_PUBLIC_appId=
NEXT_PUBLIC_measurementId=

# Optional backend API (used by some features)
NEXT_PUBLIC_BACKEND_URL=
```

Notes:

- Firebase config is read in `src/components/Firebase/firebase.js`.
- `next.config.js` maps `REACT_APP_*` to `NEXT_PUBLIC_*` for backward compatibility.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build production bundle
- `npm run start` - Run production server
- `npm run lint` - Run ESLint on `src`

## Project Structure

- `src/pages` - Next.js pages (`_app`, `_document`, catch-all route)
- `src/components` - UI and feature components
- `src/components/Firebase` - Firebase wrapper and context
- `src/reducers` - Redux store
- `public` - static assets, legacy vendor scripts, CSS

## Deployment

This project can be deployed to any Next.js-compatible platform.

Typical production flow:

```bash
npm ci
npm run build
npm run start
```

If deploying with Firebase Hosting/Functions, ensure your hosting config serves the Next.js build output via your chosen adapter/runtime.

## Maintenance Notes

- Legacy jQuery/bootstrap template scripts are still loaded for UI behavior parity.
- Some lint warnings remain intentionally for legacy image/style patterns.
- Prefer incremental modernization to avoid regressions in core team workflows.
