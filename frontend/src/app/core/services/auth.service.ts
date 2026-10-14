import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  DecodedToken
} from '../models/auth.models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  private readonly API_URL = 'http://localhost:8000/api/auth';
  private readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly USER_KEY = 'auth_user';

  // Signals for reactive state management
  private readonly _currentUser = signal<User | null>(this.getStoredUser());
  private readonly _accessToken = signal<string | null>(localStorage.getItem(this.ACCESS_TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(localStorage.getItem(this.REFRESH_TOKEN_KEY));

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly accessToken = this._accessToken.asReadonly();
  public readonly refreshToken = this._refreshToken.asReadonly();
  public readonly isAuthenticated = computed(() => !!this._accessToken());

  constructor() {
    // If we have an access token on boot, check expiration and fetch latest profile
    if (this._accessToken()) {
      if (this.isTokenExpired(this._accessToken()!)) {
        // Try refreshing if refresh token is present
        if (this._refreshToken()) {
          this.refreshAccessToken().subscribe({
            next: () => this.fetchProfile().subscribe(),
            error: () => this.logout(false)
          });
        } else {
          this.logout(false);
        }
      } else {
        this.fetchProfile().subscribe({
          error: () => {
            // If fetching profile fails (e.g. backend offline or invalid token), handle gracefully
          }
        });
      }
    }
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register/`, payload).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login/`, credentials).pipe(
      tap(res => {
        this.setSession(res.access, res.refresh);
        // After login, fetch user profile
        this.fetchProfile().subscribe();
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  refreshAccessToken(): Observable<TokenRefreshResponse> {
    const refresh = this._refreshToken();
    if (!refresh) {
      return throwError(() => new Error('No refresh token available'));
    }

    const payload: TokenRefreshRequest = { refresh };
    return this.http.post<TokenRefreshResponse>(`${this.API_URL}/token/refresh/`, payload).pipe(
      tap(res => {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, res.access);
        this._accessToken.set(res.access);
      }),
      catchError(error => {
        this.logout(false);
        return throwError(() => error);
      })
    );
  }

  fetchProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile/`).pipe(
      tap(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this._currentUser.set(user);
      })
    );
  }

  logout(notify: boolean = true): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._currentUser.set(null);

    this.router.navigate(['/login']);

    if (notify) {
      this.notification.info('You have been securely signed out.', 'Logged Out');
    }
  }

  public decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decodedStr = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodedStr);
    } catch {
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  }

  public getTokenExpiryCountdown(): string {
    const token = this._accessToken();
    if (!token) return 'No active token';
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 'Unknown';
    const now = Math.floor(Date.now() / 1000);
    const diff = decoded.exp - now;
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  }

  private setSession(access: string, refresh: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
    this._accessToken.set(access);
    this._refreshToken.set(refresh);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
