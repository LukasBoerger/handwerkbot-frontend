import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cookie-banner',
  imports: [RouterLink],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
})
export class CookieBanner {
  visible = signal(localStorage.getItem('cookie_accepted') !== 'true');

  accept() {
    localStorage.setItem('cookie_accepted', 'true');
    this.visible.set(false);
  }
}
