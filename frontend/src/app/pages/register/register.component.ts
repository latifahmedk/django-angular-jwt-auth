import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly showPassword = signal<boolean>(false);
  protected readonly showConfirmPassword = signal<boolean>(false);
  protected readonly serverErrors = signal<string[]>([]);

  protected readonly registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.serverErrors.set([]);

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notification.success(`Account for "${res.username}" created successfully! Please sign in.`, 'Registration Complete');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorList: string[] = [];

        if (err.error && typeof err.error === 'object') {
          for (const key of Object.keys(err.error)) {
            const val = err.error[key];
            if (Array.isArray(val)) {
              errorList.push(`${key}: ${val.join(' ')}`);
            } else if (typeof val === 'string') {
              errorList.push(`${key}: ${val}`);
            }
          }
        } else if (err.status === 0) {
          errorList.push('Cannot connect to Django backend. Ensure http://localhost:8000 is running.');
        } else {
          errorList.push('An unexpected error occurred during registration.');
        }

        this.serverErrors.set(errorList);
        this.notification.error('Failed to create account. Please check the form errors.', 'Registration Error');
      }
    });
  }
}
