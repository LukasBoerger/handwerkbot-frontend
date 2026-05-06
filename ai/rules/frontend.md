# Frontend-Regeln

- Angular 19 mit Angular Material.
- Reactive Forms, KEINE Template-driven Forms.
- KEINE Angular Signals.
- async pipe statt manueller Subscriptions wo möglich.
- Unsubscribe in ngOnDestroy (takeUntilDestroyed oder Subject).
- Kleine, fokussierte Komponenten.
- CSS nur in .scss-Dateien, keine Inline-Styles.
- Deutsche UI-Texte, englischer Code.
- API-URL immer aus environment.apiUrl.
- Keine neuen npm-Packages ohne Begründung.
