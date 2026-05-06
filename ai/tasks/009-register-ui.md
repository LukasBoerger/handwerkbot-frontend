# Task 009 – Register UI fixen

## Probleme
1. Logo-Bild lädt nicht (kaputtes img-Tag)
2. Header-Layout: "Konto erstellen" + Logo + Benefits
   stehen nebeneinander statt untereinander
3. Betriebsname-Label verschwindet im Schritt 2

## Fix register.html

1. Logo-img entfernen falls assets/logo.svg nicht existiert.
   Ersetze durch Text-Logo:
   <div class="register-logo">
     <span class="logo-text">Kommuvo</span>
     <span class="logo-icon">🔧</span>
   </div>

2. Header-Layout in register.scss:
   .register-header {
   display: flex;
   flex-direction: column;
   align-items: center;
   text-align: center;
   gap: 8px;
   margin-bottom: 24px;
   }

3. Betriebsname mat-form-field:
   Prüfe ob appearance="outline" gesetzt ist.
   Falls label verschwindet: füge floatLabel="always" hinzu:
   <mat-form-field appearance="outline" floatLabel="always">
