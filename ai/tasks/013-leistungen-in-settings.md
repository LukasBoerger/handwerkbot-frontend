# Task 013 – Leistungen Chip-Auswahl auch in Settings

## Problem
In /settings gibt es für Leistungen nur ein simples Textfeld.
Der Setup-Wizard hat nach Task 012 eine kategorisierte
Chip-Auswahl mit freier Eingabe – die soll auch in Settings
verfügbar sein.

## Lösung
Extrahiere die Leistungs-Auswahl aus setup-wizard in eine
wiederverwendbare Komponente:

src/app/components/service-selector/
service-selector.ts
service-selector.html  
service-selector.scss

## Interface

@Input() selectedServices: string[] = [];
@Output() servicesChanged = new EventEmitter<string[]>();

Die Komponente enthält:
- serviceCategories (identisch zu setup-wizard)
- toggleService(), toggleCategory(), addCustomService()
- Beim Ändern: this.servicesChanged.emit(this.selectedServices)

## Einbindung in setup-wizard.html
Ersetze bisherige Chip-Logik durch:
<app-service-selector
[selectedServices]="selectedServices"
(servicesChanged)="onServicesChanged($event)">
</app-service-selector>

## Einbindung in settings.html
Ersetze das businessServices mat-form-field durch:
<app-service-selector
[selectedServices]="selectedServices"
(servicesChanged)="onServicesChanged($event)">
</app-service-selector>

## In settings.ts
selectedServices: string[] = [];

onServicesChanged(services: string[]): void {
this.selectedServices = services;
this.form.get('businessServices')
?.setValue(services.join(', '));
}

Beim Laden der Settings (loadSettings()):
this.selectedServices =
(data.businessServices || '').split(',')
.map((s: string) => s.trim())
.filter((s: string) => s.length > 0);
