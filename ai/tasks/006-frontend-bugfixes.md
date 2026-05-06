# Task 006 – Frontend Bugfixes (Audit-Ergebnis)

Setze alle Findings aus Task 005 um, nach Priorität.

## 🔴 Kritisch (zuerst)

1. register.html:82 – Submit-Button Validierung:
   [disabled]="businessForm.invalid || loading"

2. setup-wizard.html – <mat-error> außerhalb mat-form-field ersetzen:
   <p class="error-hint" *ngIf="step1.get('businessServices')?.invalid 
      && step1.get('businessServices')?.touched">
     Mindestens eine Leistung auswählen
   </p>

3. tenantId null-Guard in allen drei Stellen:
  - appointment.service.ts:17
  - settings.ts:128
  - test-chat.ts:34
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return EMPTY;

4. dashboard.ts:153 – updateStatus() error-Callback:
   error: () => this.snackBar.open('❌ Fehler beim Aktualisieren',
   'OK', { duration: 3000 })

## 🟡 Mittel

5. Memory Leaks – takeUntilDestroyed() in:
  - register.ts:56
  - dashboard.ts:93
  - settings.ts:114
    private destroyRef = inject(DestroyRef);
    .pipe(takeUntilDestroyed(this.destroyRef))

6. dashboard.html – Datum formatieren:
   {{ a.datetime | date:'dd.MM.yyyy HH:mm' }}
   DatePipe in Imports ergänzen.

7. register.scss – .btn-submit: width: 100% → flex: 1

8. setup-wizard.ts – stepper.next() erst nach erfolgreichem
   API-Call in next-Callback aufrufen (nicht fire-and-forget).

9. dashboard.ts – updatingId: string | null = null,
   Buttons während Update deaktivieren.

## 🟢 Minor

10. Inline-Styles auslagern:
  - register.html:75 style="margin-bottom: 12px;" → SCSS
  - dashboard.html:184 style="padding: 32px 24px" → SCSS

11. setup-wizard.scss – hardcodierte RGB-Farben durch
    CSS-Variablen ersetzen.

12. login.ts:43 – this.loading = true in fillDemo() entfernen.

13. login.html + register.html – autocomplete-Attribute:
    autocomplete="email" / autocomplete="current-password"

## Ausgabe
Liste alle geänderten Dateien mit kurzem Kommentar.
