# Task 012 – Leistungen kategorisiert + freie Eingabe

## Ziel
Leistungsauswahl im Setup-Wizard (Schritt 1) übersichtlicher gestalten:
- Kategorien mit aufklappbaren Gruppen
- Mehr Optionen pro Kategorie
- Eigene Leistung per Freitext hinzufügen

## Datenstruktur in setup-wizard.ts

readonly serviceCategories = [
{
name: 'Elektro',
icon: '⚡',
services: [
'Elektroinstallation', 'Reparaturen', 'Notdienst',
'Beleuchtung', 'Sicherheitstechnik', 'Smarthome',
'Photovoltaik', 'Ladestation (E-Auto)', 'Hausanschluss'
]
},
{
name: 'Sanitär & Heizung',
icon: '🔧',
services: [
'Sanitärinstallation', 'Heizungsinstallation',
'Rohrreinigung', 'Badezimmersanierung', 'Notdienst',
'Wartung & Inspektion', 'Klimaanlage', 'Wärmepumpe'
]
},
{
name: 'Maler & Ausbau',
icon: '🎨',
services: [
'Malerarbeiten', 'Tapezieren', 'Fassadengestaltung',
'Trockenbau', 'Bodenbelag', 'Fliesenlegen',
'Dämmarbeiten', 'Fenster & Türen'
]
},
{
name: 'Dachdecker & Zimmerer',
icon: '🏠',
services: [
'Dachsanierung', 'Dacheindeckung', 'Dachfenster',
'Holzbau', 'Carport', 'Terrassenbau'
]
},
{
name: 'Sonstiges',
icon: '🛠️',
services: [
'Schlüsseldienst', 'Schädlingsbekämpfung',
'Reinigung', 'Gartenarbeit', 'Umzug'
]
}
];

## Neue Properties

customServiceInput = '';
expandedCategories: Set<string> = new Set();

toggleCategory(name: string): void {
if (this.expandedCategories.has(name)) {
this.expandedCategories.delete(name);
} else {
this.expandedCategories.add(name);
}
}

isCategoryExpanded(name: string): boolean {
return this.expandedCategories.has(name);
}

addCustomService(): void {
const val = this.customServiceInput.trim();
if (val && !this.selectedServices.includes(val)) {
this.selectedServices.push(val);
this.step1.get('businessServices')
?.setValue(this.selectedServices.join(', '));
}
this.customServiceInput = '';
}

## UI in setup-wizard.html

Ersetze die flache Chip-Liste durch:

@for (cat of serviceCategories; track cat.name) {
  <div class="service-category">
    <button type="button" 
            class="category-header"
            (click)="toggleCategory(cat.name)">
      <span>{{ cat.icon }} {{ cat.name }}</span>
      <span>{{ isCategoryExpanded(cat.name) ? '▲' : '▼' }}</span>
    </button>

    @if (isCategoryExpanded(cat.name)) {
      <div class="category-chips">
        @for (s of cat.services; track s) {
          <button type="button"
                  class="service-chip"
                  [class.service-chip--selected]="isSelected(s)"
                  (click)="toggleService(s)">
            {{ s }}
          </button>
        }
      </div>
    }
  </div>
}

<!-- Ausgewählte Leistungen -->
@if (selectedServices.length > 0) {
  <div class="selected-services">
    <p class="selected-label">Ausgewählt:</p>
    <div class="selected-chips">
      @for (s of selectedServices; track s) {
        <span class="selected-chip">
          {{ s }}
          <button type="button" (click)="toggleService(s)">✕</button>
        </span>
      }
    </div>
  </div>
}

<!-- Eigene Leistung hinzufügen -->
<div class="custom-service">
  <input 
    [(ngModel)]="customServiceInput"
    placeholder="Eigene Leistung eingeben..."
    (keydown.enter)="addCustomService(); $event.preventDefault()"
    class="custom-input">
  <button type="button" 
          class="btn-add"
          (click)="addCustomService()"
          [disabled]="!customServiceInput.trim()">
    + Hinzufügen
  </button>
</div>

## SCSS in setup-wizard.scss

.service-category {
margin-bottom: 8px;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 8px;
overflow: hidden;
}

.category-header {
width: 100%;
display: flex;
justify-content: space-between;
padding: 10px 14px;
background: rgba(255,255,255,0.05);
border: none;
color: rgba(255,255,255,0.8);
cursor: pointer;
font-size: 14px;
&:hover { background: rgba(255,255,255,0.08); }
}

.category-chips {
display: flex;
flex-wrap: wrap;
gap: 6px;
padding: 10px 14px;
}

.selected-services {
margin-top: 12px;
.selected-label {
font-size: 12px;
color: rgba(255,255,255,0.5);
margin-bottom: 6px;
}
.selected-chips {
display: flex;
flex-wrap: wrap;
gap: 6px;
}
.selected-chip {
display: flex;
align-items: center;
gap: 4px;
padding: 4px 10px;
background: rgba(245,166,35,0.15);
border: 1px solid rgba(245,166,35,0.4);
border-radius: 20px;
font-size: 13px;
color: #f5a623;
button {
background: none;
border: none;
color: #f5a623;
cursor: pointer;
padding: 0;
font-size: 11px;
}
}
}

.custom-service {
display: flex;
gap: 8px;
margin-top: 12px;
.custom-input {
flex: 1;
padding: 8px 12px;
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.15);
border-radius: 6px;
color: white;
font-size: 13px;
&::placeholder { color: rgba(255,255,255,0.3); }
&:focus { outline: none;
border-color: rgba(245,166,35,0.5); }
}
.btn-add {
padding: 8px 14px;
background: rgba(245,166,35,0.15);
border: 1px solid rgba(245,166,35,0.4);
border-radius: 6px;
color: #f5a623;
cursor: pointer;
font-size: 13px;
&:disabled { opacity: 0.4; cursor: not-allowed; }
}
}

## Hinweis
FormsModule muss in setup-wizard.ts imports[] sein
(für [(ngModel)] auf customServiceInput).
