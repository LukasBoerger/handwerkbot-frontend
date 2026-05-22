import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  const isPublicRoute = req.url.includes('/api/auth/') ||
    req.url.includes('/public/') ||
    req.url.includes('/public-info/');

  if (token && !isPublicRoute) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      } else if (error.status === 403) {
        snackBar.open('Keine Berechtigung', 'Schließen', { duration: 3000 });
      } else if (error.status === 500) {
        snackBar.open('Server-Fehler. Bitte versuche es erneut.', 'Schließen', { duration: 4000 });
      }
      return throwError(() => error);
    })
  );
};
