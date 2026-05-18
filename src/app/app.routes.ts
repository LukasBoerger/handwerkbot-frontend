import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Settings } from './pages/settings/settings';
import { authGuard } from './guards/auth.guard';
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

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
  { path: 'appointments', component: AppointmentsPage, canActivate: [authGuard] },
  { path: 'setup', component: SetupWizard, canActivate: [authGuard] },
  { path: 'chat', component: ChatPage, canActivate: [authGuard] },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: 'impressum', component: Impressum },
  { path: 'datenschutz', component: Datenschutz },
  { path: 'pricing', component: Pricing },
  { path: 'public/chat/:token', component: PublicChatPage },
  { path: 'oauth2/callback', component: OAuthCallbackPage },
  { path: '**', redirectTo: '' }
];
