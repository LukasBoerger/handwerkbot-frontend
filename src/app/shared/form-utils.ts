// Fokussiert das erste ungültige Formularfeld innerhalb des Host-Elements.
// Angular setzt `ng-invalid` direkt auf die Input-Elemente (Custom-Forms UND Material),
// daher genügt ein einziger Selektor. Wird nach markAllAsTouched() aufgerufen, damit
// der Nutzer sofort sieht, welches Pflichtfeld fehlt (statt eines stillen Submit-Fehlers).
export function focusFirstInvalid(host: HTMLElement | null | undefined): void {
  if (!host) return;
  const el = host.querySelector<HTMLElement>(
    'input.ng-invalid, textarea.ng-invalid, select.ng-invalid',
  );
  if (!el) return;
  el.focus();
  // scrollIntoView ist in jsdom (Vitest) nicht implementiert – defensiv absichern.
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}
