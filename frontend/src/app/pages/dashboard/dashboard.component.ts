import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DecodedToken, User } from '../../core/models/auth.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  protected readonly isRefreshingToken = signal<boolean>(false);
  protected readonly isTestingApi = signal<boolean>(false);
  protected readonly apiResponseTime = signal<number | null>(null);
  protected readonly showTokenInspector = signal<boolean>(false);
  protected readonly copiedToken = signal<boolean>(false);
  protected readonly tokenCountdown = signal<string>('');

  private countdownInterval: any;

  ngOnInit(): void {
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private updateCountdown(): void {
    this.tokenCountdown.set(this.authService.getTokenExpiryCountdown());
  }

  get decodedToken(): DecodedToken | null {
    const token = this.authService.accessToken();
    return token ? this.authService.decodeToken(token) : null;
  }

  testTokenRefresh(): void {
    this.isRefreshingToken.set(true);
    const start = performance.now();

    this.authService.refreshAccessToken().subscribe({
      next: () => {
        const duration = Math.round(performance.now() - start);
        this.isRefreshingToken.set(false);
        this.updateCountdown();
        this.notification.success(`Access token rotated successfully in ${duration}ms!`, 'Token Refreshed');
      },
      error: () => {
        this.isRefreshingToken.set(false);
        this.notification.error('Failed to refresh token. Session may have expired.', 'Refresh Error');
      }
    });
  }

  testProtectedApi(): void {
    this.isTestingApi.set(true);
    const start = performance.now();

    this.authService.fetchProfile().subscribe({
      next: (user: User) => {
        const duration = Math.round(performance.now() - start);
        this.isTestingApi.set(false);
        this.apiResponseTime.set(duration);
        this.notification.success(`Authenticated request to /api/auth/profile/ succeeded (${duration}ms).`, 'API Verified');
      },
      error: () => {
        this.isTestingApi.set(false);
        this.notification.error('Failed to communicate with protected profile endpoint.', 'Request Failed');
      }
    });
  }

  toggleTokenInspector(): void {
    this.showTokenInspector.update(v => !v);
  }

  copyToken(): void {
    const token = this.authService.accessToken();
    if (token) {
      navigator.clipboard.writeText(token).then(() => {
        this.copiedToken.set(true);
        this.notification.info('Access token copied to clipboard.', 'Copied');
        setTimeout(() => this.copiedToken.set(false), 2500);
      });
    }
  }
}
