import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { TenantStatusService } from '../../services/tenant-status.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule,
    MatIconModule, MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  auth = inject(AuthService);
  private tenantStatus = inject(TenantStatusService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  menuOpen = false;
  // Blendet den kommerziellen "Preise"-Link im Study-Mode aus.
  studyMode = false;
  private studyModeLoaded = false;

  ngOnInit() {
    // Die Navbar ist eine persistente Instanz (außerhalb des Router-Outlets) und
    // wird bei Navigation nicht neu erstellt. Damit sie den Study-Mode direkt nach
    // dem Login ohne Reload kennt, prüfen wir bei jedem NavigationEnd nach.
    this.loadStudyMode();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadStudyMode());
  }

  private loadStudyMode() {
    if (this.studyModeLoaded || !this.auth.isLoggedIn()) return;
    this.tenantStatus
      .studyMode()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((studyMode) => {
        this.studyMode = studyMode;
        this.studyModeLoaded = true;
      });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}
