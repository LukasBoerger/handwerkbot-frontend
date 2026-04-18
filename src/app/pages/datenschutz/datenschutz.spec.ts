import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Datenschutz } from './datenschutz';

describe('Datenschutz', () => {
  let component: Datenschutz;
  let fixture: ComponentFixture<Datenschutz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Datenschutz,
        RouterTestingModule.withRoutes([{ path: '**', redirectTo: '' }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Datenschutz);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
