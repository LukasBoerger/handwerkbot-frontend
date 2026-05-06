# Task 007 – Chat als eigene Seite

## Problem
Test-Chat ist aktuell ein aufklappbares Panel im Dashboard.
Das ist unübersichtlich und der Bot hängt manchmal weil
der Chat-Context verloren geht.

## Ziel
Chat als eigene Route /chat die in einem neuen Tab öffnet.

## Umsetzung

1. Verschiebe app-test-chat aus dem Dashboard-Panel
   in eine neue Seite: src/app/pages/chat/chat.ts + chat.html + chat.scss

2. Füge Route hinzu in app.routes.ts:
   { path: 'chat', component: ChatPage, canActivate: [authGuard] }

3. Ersetze im Dashboard den "Bot testen"-Button:
   <button class="btn-outline" (click)="openChat()">🧪 Bot testen</button>

   openChat(): void {
   window.open('/chat', '_blank');
   }

4. chat.html soll nur den Chat zeigen, kein Dashboard-Layout:
  - Header mit Bot-Name und "● Online"-Status
  - Hinweis "Testnachrichten werden nicht gespeichert"
  - test-chat Komponente
  - Kein Sidebar, kein Navigation

5. Entferne chatOpen-Toggle und chat-panel aus dashboard.ts + dashboard.html
