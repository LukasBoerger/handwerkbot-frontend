import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ServiceSelector } from './service-selector';

describe('ServiceSelector', () => {
  let component: ServiceSelector;
  let fixture: ComponentFixture<ServiceSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceSelector, FormsModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceSelector);
    component = fixture.componentInstance;
    component.selectedServices = [];
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte 5 Kategorien haben', () => {
    expect(component.serviceCategories.length).toBe(5);
  });

  describe('toggleCategory', () => {
    it('öffnet eine geschlossene Kategorie', () => {
      component.toggleCategory('Elektro');
      expect(component.isCategoryExpanded('Elektro')).toBe(true);
    });

    it('schließt eine geöffnete Kategorie', () => {
      component.toggleCategory('Elektro');
      component.toggleCategory('Elektro');
      expect(component.isCategoryExpanded('Elektro')).toBe(false);
    });

    it('mehrere Kategorien können gleichzeitig offen sein', () => {
      component.toggleCategory('Elektro');
      component.toggleCategory('Sanitär & Heizung');
      expect(component.isCategoryExpanded('Elektro')).toBe(true);
      expect(component.isCategoryExpanded('Sanitär & Heizung')).toBe(true);
    });
  });

  describe('isCategoryExpanded', () => {
    it('gibt false zurück für geschlossene Kategorie', () => {
      expect(component.isCategoryExpanded('Elektro')).toBe(false);
    });

    it('gibt true zurück für geöffnete Kategorie', () => {
      component.toggleCategory('Elektro');
      expect(component.isCategoryExpanded('Elektro')).toBe(true);
    });
  });

  describe('isSelected', () => {
    it('gibt false zurück wenn Service nicht ausgewählt', () => {
      expect(component.isSelected('Elektroinstallation')).toBe(false);
    });

    it('gibt true zurück wenn Service ausgewählt', () => {
      component.selectedServices = ['Elektroinstallation'];
      expect(component.isSelected('Elektroinstallation')).toBe(true);
    });
  });

  describe('toggleService', () => {
    it('fügt einen Service hinzu', () => {
      const emitted: string[][] = [];
      component.servicesChanged.subscribe((s) => emitted.push(s));

      component.toggleService('Elektroinstallation');

      expect(component.selectedServices).toContain('Elektroinstallation');
      expect(emitted[0]).toContain('Elektroinstallation');
    });

    it('entfernt einen bereits ausgewählten Service', () => {
      component.selectedServices = ['Elektroinstallation'];
      const emitted: string[][] = [];
      component.servicesChanged.subscribe((s) => emitted.push(s));

      component.toggleService('Elektroinstallation');

      expect(component.selectedServices).not.toContain('Elektroinstallation');
      expect(emitted[0]).not.toContain('Elektroinstallation');
    });

    it('lässt andere Services unberührt', () => {
      component.selectedServices = ['Reparaturen'];
      component.toggleService('Elektroinstallation');
      expect(component.selectedServices).toContain('Reparaturen');
    });
  });

  describe('addCustomService', () => {
    it('fügt einen eigenen Service hinzu', () => {
      const emitted: string[][] = [];
      component.servicesChanged.subscribe((s) => emitted.push(s));

      component.customServiceInput = 'Mein Service';
      component.addCustomService();

      expect(component.selectedServices).toContain('Mein Service');
      expect(component.customServiceInput).toBe('');
    });

    it('ignoriert leere Eingabe', () => {
      component.customServiceInput = '   ';
      component.addCustomService();
      expect(component.selectedServices.length).toBe(0);
    });

    it('fügt keinen Duplikat hinzu', () => {
      component.selectedServices = ['Mein Service'];
      component.customServiceInput = 'Mein Service';
      component.addCustomService();
      expect(component.selectedServices.filter((s) => s === 'Mein Service').length).toBe(1);
    });

    it('setzt Eingabefeld nach dem Hinzufügen zurück', () => {
      component.customServiceInput = 'Neuer Service';
      component.addCustomService();
      expect(component.customServiceInput).toBe('');
    });
  });

  describe('Empty-State', () => {
    it('zeigt den Hinweis, wenn keine Leistung ausgewählt ist', () => {
      component.selectedServices = [];
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('[data-cy="services-empty"]');
      expect(empty).not.toBeNull();
    });

    it('blendet den Hinweis aus, sobald eine Leistung ausgewählt ist', () => {
      component.selectedServices = ['Elektroinstallation'];
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('[data-cy="services-empty"]');
      expect(empty).toBeNull();
    });
  });
});
