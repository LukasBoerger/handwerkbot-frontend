# HandwerkBot Frontend – Claude Code Arbeitskontext

## Rolle von Claude

Arbeitsweise:
1. Lies zuerst den Task aus `ai/tasks/`.
2. Analysiere bestehende Komponenten und Services.
3. Erstelle einen klaren, minimalen Umsetzungsplan.
4. Setze nur den aktuellen Task um (kein Scope-Creep).
5. Gib eine kurze Zusammenfassung zurück.

---

## Projektverständnis

Angular 19 SPA für die Kommuvo-Plattform. Handwerksbetriebe verwalten hier ihren KI-WhatsApp-Bot (Termine, Einstellungen, Onboarding, Billing).

---

## Architektur

- Angular 21.2.x, Angular Material 21.2.2, Reactive Forms
- Hosting: Vercel
- Backend-API: Railway (api.kommuvo.de)
- Auth: JWT (localStorage)
- Testing: Vitest 4.x (Unit), Cypress 15.x (E2E)
- Linting: ESLint + angular-eslint, Prettier 3.x

---

## Seitenstruktur (`src/app/pages/`)

| Seite             | Route              | Auth-Guard |
|-------------------|--------------------|------------|
| `landing`         | `/`                | nein       |
| `login`           | `/login`           | nein       |
| `register`        | `/register`        | nein       |
| `forgot-password` | `/forgot-password` | nein       |
| `reset-password`  | `/reset-password`  | nein       |
| `pricing`         | `/pricing`         | nein       |
| `impressum`       | `/impressum`       | nein       |
| `datenschutz`     | `/datenschutz`     | nein       |
| `dashboard`       | `/dashboard`       | ja         |
| `settings`        | `/settings`        | ja         |
| `setup-wizard`    | `/setup`           | ja         |
| `chat`            | `/chat`            | ja         |

---

## Komponenten (`src/app/components/`)

- `test-chat` → Chatbot-Testoberfläche im Dashboard
- `service-selector` → Auswahl von Dienstleistungen (Onboarding/Settings)

## Shared (`src/app/shared/`)

- `navbar` → Hauptnavigation
- `cookie-banner` → DSGVO Cookie-Hinweis

---

## Services (`src/app/services/`)

- `auth.service.ts` → Login, Register, Passwort-Reset, Token-Verwaltung
- `appointment.service.ts` → Termine laden, Status ändern
- `tenant.ts` → Placeholder (Injectable, noch leer)
- `auth.ts` → Placeholder (Injectable, noch leer)

## Guards (`src/app/guards/`)

- `auth.guard.ts` → Schützt alle Auth-Routen

---

## Auth-Konventionen

- Token: `localStorage.getItem('token')`
- TenantId: `localStorage.getItem('tenantId')`
- Setup abgeschlossen: `localStorage.getItem('setupDone')`
- API-URL immer aus `environment.apiUrl`

---

## UI-Konventionen

- Angular Material durchgehend
- Reactive Forms (KEINE Template-driven Forms)
- KEINE Angular Signals
- `async` pipe bevorzugen
- Dark Theme (bestehendes CSS respektieren)
- Deutsche UI-Texte
- Barrierefreiheit: `aria-label` bei Icon-Buttons

---

## Code-Konventionen

- Kommentare: Deutsch
- Code: Englisch
- Keine neuen Libraries ohne Begründung
- Bestehende Patterns einhalten
- Keine unnötigen Refactorings
- Kein Inline-Style – CSS in `.scss`-Datei

---

## Arbeitsregeln

Nicht erlaubt:
- Komplette Komponenten umbauen
- Neue Libraries ohne Rückfrage
- Angular Signals verwenden
- Hardcodierte API-URLs (immer `environment.apiUrl`)

Erwünscht:
- Minimal-invasive Änderungen
- Bestehenden Stil einhalten
- Kleine, fokussierte Komponenten

---

## Entscheidungsprinzip

1. Einfache Lösung bevorzugen
2. Bestehende Patterns bevorzugen
3. Nachfragen, wenn Risiko hoch ist

---

## Ausgabeformat

Am Ende immer:
- Was wurde geändert?
- Welche Dateien?
- Warum so umgesetzt?
- Offene Punkte / Risiken
