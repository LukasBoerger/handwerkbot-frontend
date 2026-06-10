import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { authGuard } from './guards/auth.guard';
import { siteLockGuard } from './guards/site-lock.guard';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Impressum } from './pages/impressum/impressum';
import { Datenschutz } from './pages/datenschutz/datenschutz';
import { Pricing } from './pages/pricing/pricing';
import { SiteLockPage } from './pages/site-lock/site-lock';

export const routes: Routes = [
  { path: 'site-lock', component: SiteLockPage },
  { path: '', component: Landing, canActivate: [siteLockGuard] },
  { path: 'login', component: Login, canActivate: [siteLockGuard] },
  { path: 'register', component: Register, canActivate: [siteLockGuard] },
  { path: 'forgot-password', component: ForgotPassword, canActivate: [siteLockGuard] },
  { path: 'reset-password', component: ResetPassword, canActivate: [siteLockGuard] },
  { path: 'impressum', component: Impressum, canActivate: [siteLockGuard] },
  { path: 'datenschutz', component: Datenschutz, canActivate: [siteLockGuard] },
  { path: 'pricing', component: Pricing, canActivate: [siteLockGuard] },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [siteLockGuard, authGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
    canActivate: [siteLockGuard, authGuard],
  },
  {
    path: 'appointments',
    loadComponent: () =>
      import('./pages/appointments/appointments').then((m) => m.AppointmentsPage),
    canActivate: [siteLockGuard, authGuard],
  },
  {
    path: 'setup',
    loadComponent: () => import('./pages/setup-wizard/setup-wizard').then((m) => m.SetupWizard),
    canActivate: [siteLockGuard, authGuard],
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat').then((m) => m.ChatPage),
    canActivate: [siteLockGuard, authGuard],
  },
  {
    path: 'public/chat/:token',
    loadComponent: () => import('./pages/public-chat/public-chat').then((m) => m.PublicChatPage),
    canActivate: [siteLockGuard],
  },
  {
    path: 'oauth2/callback',
    loadComponent: () =>
      import('./pages/oauth-callback/oauth-callback').then((m) => m.OAuthCallbackPage),
    canActivate: [siteLockGuard],
  },
  { path: '**', redirectTo: '' },
];
