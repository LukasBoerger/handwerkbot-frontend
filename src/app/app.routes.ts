import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Settings } from './pages/settings/settings';
import { authGuard } from './guards/auth.guard';
import { siteLockGuard } from './guards/site-lock.guard';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Impressum } from './pages/impressum/impressum';
import { Datenschutz } from './pages/datenschutz/datenschutz';
import { Pricing } from './pages/pricing/pricing';
import { SetupWizard } from './pages/setup-wizard/setup-wizard';
import { ChatPage } from './pages/chat/chat';
import { PublicChatPage } from './pages/public-chat/public-chat';
import { AppointmentsPage } from './pages/appointments/appointments';
import { OAuthCallbackPage } from './pages/oauth-callback/oauth-callback';
import { SiteLockPage } from './pages/site-lock/site-lock';

export const routes: Routes = [
  { path: 'site-lock', component: SiteLockPage },
  { path: '', component: Landing, canActivate: [siteLockGuard] },
  { path: 'login', component: Login, canActivate: [siteLockGuard] },
  { path: 'register', component: Register, canActivate: [siteLockGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [siteLockGuard, authGuard] },
  { path: 'settings', component: Settings, canActivate: [siteLockGuard, authGuard] },
  { path: 'appointments', component: AppointmentsPage, canActivate: [siteLockGuard, authGuard] },
  { path: 'setup', component: SetupWizard, canActivate: [siteLockGuard, authGuard] },
  { path: 'chat', component: ChatPage, canActivate: [siteLockGuard, authGuard] },
  { path: 'forgot-password', component: ForgotPassword, canActivate: [siteLockGuard] },
  { path: 'reset-password', component: ResetPassword, canActivate: [siteLockGuard] },
  { path: 'impressum', component: Impressum, canActivate: [siteLockGuard] },
  { path: 'datenschutz', component: Datenschutz, canActivate: [siteLockGuard] },
  { path: 'pricing', component: Pricing, canActivate: [siteLockGuard] },
  { path: 'public/chat/:token', component: PublicChatPage, canActivate: [siteLockGuard] },
  { path: 'oauth2/callback', component: OAuthCallbackPage, canActivate: [siteLockGuard] },
  { path: '**', redirectTo: '' },
];
