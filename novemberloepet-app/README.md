# novemberloepet-app — API boundary

Dette prosjektet har nå en tydelig `src/api/`-grense som skal brukes av UI og context-kode. Målet er å holde all nettverkskommunikasjon, formatering av server-responser, og retry/logging samlet på ett sted.

Hva finnes i `src/api/`
- `apiClient.ts` — liten, sentral HTTP-klient (fetch-basert) som gir timeout, enkel retry/backoff og konsistent responsform (ApiResponse<T>). Bruk denne for grunnleggende GET/POST/PUT/DELETE.
- `deltagere.ts` — wrapper-funksjoner for `/api/deltagere` (typed): `fetchAllDeltagere`, `createDeltagere`, `updateDeltagereById`, `findRemoteByStartnummer`.
- `etapper.ts` — wrapper-funksjoner for `/api/etapper` (typed): `fetchEtapper`, `createEtapper`, `updateEtapperById`, `deleteEtapperById`.
- `types.ts` — felles typer brukt av UI og API.
- `opQueue.ts` — re-export for opQueue (single source `src/lib/opQueue.js`) for å unngå duplisering.

Designprinsipper
- UI-koden skal ikke gjøre `fetch('/api/...')` direkte; bruk funksjonene i `src/api/*`.
- API-wrappere returnerer konkrete typer (ikke `any`) og kaster på feil slik at kallende kode kan fange/queue/eller vise feilmeldinger.
- `apiClient` er liten og enkel; den håndterer timeout og retry/backoff. Du kan utvide den med auth-headers og mer avansert logging ved behov.

Eksempel
```ts
import { createDeltagere } from '../api/deltagere';
const created = await createDeltagere({ startnummer: '1', navn: 'Ola' });
```

Testing
- Det finnes enkle unit-tester for `src/api/deltagere.ts` og `src/api/etapper.ts` under `src/api/__tests__` som bruker Vitest og mocker `fetch`.
- Kjør testene med:

```bash
cd novemberloepet-app
npm install
npm test
```

Server/proxy
- `server/index.js` er proxyen mot Parse (Back4App). Den normaliserer responser fra Parse og returnerer enten et array eller et objekt for `GET /api/etapper`.
- Endepunkter:
  - `GET /api/deltagere` -> returns array of participants
  - `POST /api/deltagere` -> create participant
  - `PUT /api/deltagere/:id` -> update participant
  - `DELETE /api/deltagere/:id` -> delete participant
  - `GET /api/etapper` -> returns either array or object with `{ etapper: [...] }`
  - `POST /api/etapper` -> create config
  - `PUT /api/etapper/:id` -> update config
  - `DELETE /api/etapper/:id` -> delete config

Videre forbedringer (forslag)
- Legg til auth/CSRF-håndtering i `apiClient` hvis proxy krever det.
- Bytt test-runner eller konfigurer CI (GitHub Actions) for automatisk testing.
- Ekstra enhetstester for `apiClient` og mer robust mocking av timeout/retry.
