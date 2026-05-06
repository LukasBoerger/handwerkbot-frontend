# Task 005 – Frontend Audit: Bugs & CSS

## Ziel
Vollständiger Audit des Frontends auf Bugs, schlechtes CSS und UX-Probleme.

## Scope
Alle Seiten und Komponenten:
- /register
- /setup (Setup-Wizard)
- /dashboard
- /settings
- /login
- components/test-chat

## Prüfpunkte

### Bugs
- Unsubscribed Observables (Memory Leaks)
- Fehlende Error-Handling bei API-Calls
- Fehlende Loading-States
- Edge Cases (leere Listen, null-Werte)
- Console-Errors

### CSS / Styling
- Inkonsistente Abstände (margin/padding)
- Elemente die sich überlappen oder verdecken
- Mobile-Responsiveness (min. 375px Breite)
- Fehlende Hover/Focus-States bei Buttons
- Inkonsistente Farben (nicht aus CSS-Variablen)
- Hardcodierte Farben statt Variablen

### UX
- Fehlende Ladeanzeigen (Spinner)
- Fehlende leere Zustände (Empty States)
- Unklare Fehlermeldungen
- Fehlende Erfolgsmeldungen nach Speichern

## Ausgabe
Liste alle gefundenen Probleme nach Priorität:
- 🔴 Kritisch (bricht Funktion)
- 🟡 Mittel (schlechte UX)
- 🟢 Minor (kosmetisch)

Pro Problem: Datei + Zeile + konkreter Fix-Vorschlag.
