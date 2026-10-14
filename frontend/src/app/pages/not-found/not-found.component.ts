import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-wrapper animate-fade-in container">
      <div class="not-found-card glass-card">
        <span class="badge badge-orange">404 Error</span>
        <h1 class="error-code">Page Not Found</h1>
        <p class="error-desc">The page or resource you are looking for does not exist or has been moved.</p>
        <a routerLink="/" class="btn btn-primary" id="btn-404-home">
          <span>Return Home</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-wrapper {
      min-height: calc(100vh - 4.5rem);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
    }
    .not-found-card {
      max-width: 480px;
      width: 100%;
      padding: 3rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .error-code {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.02em;
    }
    .error-desc {
      font-size: 1rem;
      color: var(--slate-600);
      line-height: 1.6;
    }
  `]
})
export class NotFoundComponent {}
