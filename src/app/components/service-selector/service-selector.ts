import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-service-selector',
  imports: [FormsModule],
  templateUrl: './service-selector.html',
  styleUrl: './service-selector.scss',
})
export class ServiceSelector {
  @Input() selectedServices: string[] = [];
  @Output() servicesChanged = new EventEmitter<string[]>();

  customServiceInput = '';
  expandedCategories = new Set<string>();

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

  isSelected(service: string): boolean {
    return this.selectedServices.includes(service);
  }

  toggleService(service: string): void {
    const idx = this.selectedServices.indexOf(service);
    const updated = [...this.selectedServices];
    if (idx > -1) {
      updated.splice(idx, 1);
    } else {
      updated.push(service);
    }
    this.selectedServices = updated;
    this.servicesChanged.emit(updated);
  }

  addCustomService(): void {
    const val = this.customServiceInput.trim();
    if (val && !this.selectedServices.includes(val)) {
      const updated = [...this.selectedServices, val];
      this.selectedServices = updated;
      this.servicesChanged.emit(updated);
    }
    this.customServiceInput = '';
  }
}
