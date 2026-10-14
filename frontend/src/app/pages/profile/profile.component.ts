import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  protected readonly isRefreshing = signal<boolean>(false);

  ngOnInit(): void {
    this.refreshProfile();
  }

  refreshProfile(): void {
    this.isRefreshing.set(true);
    this.authService.fetchProfile().subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.notification.success('Profile details refreshed from backend.', 'Updated');
      },
      error: () => {
        this.isRefreshing.set(false);
        this.notification.error('Failed to load profile details from backend.', 'Error');
      }
    });
  }

  onLogout(): void {
    this.authService.logout(true);
  }
}
