import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'local',
  tracesSampleRate: 0.2,
  enabled: environment.production,
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
