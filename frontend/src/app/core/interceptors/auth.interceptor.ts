import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  // Exclude endpoints that do not require Authorization header
  const isAuthEndpoint = req.url.includes('/login/') || req.url.includes('/register/') || req.url.includes('/token/refresh/');

  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 unauthorized on protected route, try to refresh token once
      if (error.status === 401 && !isAuthEndpoint && authService.refreshToken()) {
        return authService.refreshAccessToken().pipe(
          switchMap(res => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.access}`
              }
            });
            return next(retryReq);
          }),
          catchError(refreshErr => {
            authService.logout(true);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
