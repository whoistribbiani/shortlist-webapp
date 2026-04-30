# Shortlist Webapp v1

Webapp React + TypeScript per costruire shortlist scouting per posizione, con:
- 12 board posizione + tab `Recap` read-only
- login password-only (`/login`)
- inserimento player con flusso `Competizione -> Squadra -> Giocatore`
- drag&drop slot-to-slot (move)
- blocco duplicati nella stessa posizione
- autosave cloud su board interna protetta
- export `.xlsx` compatibile (Overview + Recap + 12 sheet posizione)

## Stack
- Frontend: React, Vite, TypeScript, dnd-kit
- Backend: Supabase Edge Function (`functions/api`)
- DB: Supabase Postgres (`boards`, `board_meta`, `board_slots`)

## Avvio locale frontend
```bash
cp .env.example .env.local
npm install
npm run dev
```

PowerShell (alternativa):
```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

## Variabili frontend (`.env.local`)
- `VITE_API_BASE_URL` URL base API (`http://127.0.0.1:54321/functions/v1/api` in locale)
- `VITE_DEFAULT_SEASON_ID` default season
- `VITE_DEFAULT_GENDER` default gender

## Backend Supabase
### Migrazioni
```bash
npx supabase db push
```

### Deploy function
```bash
npx supabase functions deploy api --no-verify-jwt
```

### Secrets richiesti (Supabase)
- `APP_USERS_PASSWORDS_JSON` (lista password gestita dal proprietario)
- `APP_AUTH_SIGNING_SECRET`
- `APP_DEFAULT_BOARD_TOKEN`
- `SCOUTASTIC_BASE_URL`
- `SCOUTASTIC_ACCESS_KEY` oppure host-specific:
  - `SCOUTASTIC_ACCESS_KEY_SCOUTINGDEPARTMENT`
  - `SCOUTASTIC_ACCESS_KEY_GENOACFC`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## API implementate
- `POST /api/auth/login`
- `POST /api/auth/validate`
- `POST /api/auth/logout`
- `GET /api/catalog/competitions?seasonId=&gender=male`
- `GET /api/catalog/teams?competitionId=&seasonId=`
- `GET /api/catalog/players?teamId=&seasonId=`
- `GET /api/catalog/player-by-transfermarkt?transfermarktId=&seasonId=&gender=male`
- `GET /api/board/current`
- `PUT /api/board/current`
- `POST /api/board/current/export-xlsx`

## GitHub Pages (Project Pages)
Il `base` Vite viene impostato automaticamente in CI usando `GITHUB_REPOSITORY`, quindi in produzione usa `/<nome-repo>/` e in locale resta `/`.

Workflow: `.github/workflows/shortlist-webapp-pages.yml`

Secret richiesto su GitHub:
- `SHORTLIST_API_BASE_URL` -> URL pubblico della function Supabase (`.../functions/v1/api`)

## Test
```bash
npm run test
npm run build
```

E2E (dopo install browser Playwright):
```bash
npx playwright install
npm run e2e
```
