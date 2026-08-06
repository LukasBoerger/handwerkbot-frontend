import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'local',
  tracesSampleRate: 0.2,
  // Nur aktivieren, wenn ein DSN tatsächlich gesetzt ist. Ohne diese Prüfung meldet
  // Sentry in Produktion mit leerem/ungültigem DSN einen Startfehler in der Konsole.
  enabled: environment.production && !!environment.sentryDsn,
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
