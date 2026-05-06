# HandwerkBot Frontend – Claude Code Arbeitskontext

## 🎯 Rolle von Claude

Du bist der Haupt-Orchestrator für dieses Angular-Frontend.

Arbeitsweise:
1. Lies zuerst den Task aus `ai/tasks/`.
2. Analysiere bestehende Komponenten und Services.
3. Erstelle einen klaren, minimalen Umsetzungsplan.
4. Setze nur den aktuellen Task um (kein Scope-Creep).
5. Gib eine kurze, strukturierte Zusammenfassung zurück.

---

## 🧠 Projektverständnis

### Was ist HandwerkBot Frontend?

Angular 19 SPA für die Kommuvo-Plattform. Handwerksbetriebe
verwalten hier ihren KI-WhatsApp-Bot (Termine, Einstellungen, Onboarding).

---

## 🏗️ Architektur

- Framework: Angular 19, Angular Material, Reactive Forms
- Hosting: Vercel
- Backend: Spring Boot API auf Railway (api.kommuvo.de)
- Auth: JWT (gespeichert in localStorage)

---

## 📁 Struktur

src/app/
pages/          → Seiten (dashboard, settings, register, login, setup-wizard)
components/     → Wiederverwendbare Komponenten (test-chat)
services/       → API-Services (auth, appointment)
guards/         → Auth-Guard
environments/   → environment.ts (local) / environment.prod.ts (prod)

---

## 🔑 Auth-Konventionen

- Token: localStorage.getItem('token')
- TenantId: localStorage.getItem('tenantId')
- Setup abgeschlossen: localStorage.getItem('setupDone')
- API-URL immer aus environment.apiUrl

---

## 🎨 UI-Konventionen

- Angular Material durchgehend
- Reactive Forms (KEINE Template-driven Forms)
- KEINE Angular Signals
- async pipe bevorzugen
- Kleine, fokussierte Komponenten
- Dark Theme (bestehendes CSS respektieren)
- Deutsche UI-Texte

---

## ⚙️ Code-Konventionen

- Kommentare: Deutsch
- Code: Englisch
- Keine neuen Libraries ohne Begründung
- Bestehende Patterns einhalten
- Keine unnötigen Refactorings

---

## ⚡ Arbeitsregeln

Du darfst NICHT:
- Komplette Komponenten umbauen
- Neue Libraries einführen ohne Rückfrage
- Angular Signals verwenden
- Inline-Styles (CSS in scss-Datei)

Du SOLLST:
- Minimal-invasive Änderungen machen
- Bestehenden Stil einhalten
- environment.apiUrl statt hardcodierter URLs
- Barrierefreiheit beachten (aria-labels)

---

## 🧠 Entscheidungsprinzip

1. Bevorzuge einfache Lösung
2. Bevorzuge bestehende Patterns im Projekt
3. Frage nach, wenn Risiko hoch ist

---

## 📥 Tasks

Tasks kommen aus: ai/tasks/*.md

## 📤 Ausgabeformat

Am Ende immer:
- Was wurde geändert?
- Welche Dateien?
- Warum so umgesetzt?
- Offene Punkte / Risiken
