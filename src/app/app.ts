import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { CookieBanner } from './shared/cookie-banner/cookie-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Navbar, CookieBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('kommuvo');
}
