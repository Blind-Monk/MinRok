import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container d-flex justify-content-center align-items-center" style="min-height: 80vh;">
      <div class="card p-4 shadow-sm bg-white" style="width: 440px;">
        <div class="text-center mb-4">
          <h3 class="card-title fw-bold mb-1">Merchant Sign In</h3>
          <span class="badge bg-primary text-uppercase px-2 py-1">Active Mode: {{ activeProvider }}</span>
        </div>

        <!-- Form Authentication -->
        <div *ngIf="activeProvider === 'form'">
          <div class="mb-3">
            <label class="form-label">Email address</label>
            <input type="email" class="form-control" [(ngModel)]="email" placeholder="merchant@company.com">
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" [(ngModel)]="password" placeholder="••••••••">
          </div>

          <button class="btn btn-primary w-100 mb-3" (click)="submitForm()">
            {{ isSignup ? 'Sign Up & Create Account' : 'Log In' }}
          </button>

          <div class="text-center">
            <a href="javascript:void(0)" (click)="isSignup = !isSignup" class="small text-muted">
              {{ isSignup ? 'Already have an account? Log in' : "Don't have an account? Create one" }}
            </a>
          </div>
        </div>

        <!-- Windows Authentication -->
        <div *ngIf="activeProvider === 'windows'" class="text-center py-3">
          <p class="text-muted small">Sign in using Windows System Authentication</p>
          <div class="mb-3 text-start">
            <label class="form-label">Windows Username (optional override)</label>
            <input type="text" class="form-control" [(ngModel)]="windowsUsername" placeholder="e.g. WIN_LOCAL_USER">
          </div>
          <button class="btn btn-dark w-100 mb-2" (click)="loginWindows()">
            <i class="bi bi-windows me-2"></i> Continue with Windows Auth
          </button>
        </div>

        <!-- SSO / OAuth Authentication (Azure, Amazon, Auth0, Google, Microsoft, GitHub, Apple) -->
        <div *ngIf="isSsoProvider(activeProvider)" class="text-center py-3">
          <p class="text-muted small">Authenticate using {{ activeProvider | uppercase }} SSO</p>

          <div class="mb-3 text-start">
            <label class="form-label">{{ activeProvider | uppercase }} Email</label>
            <input type="email" class="form-control" [(ngModel)]="ssoEmail" placeholder="user@domain.com">
          </div>

          <button class="btn btn-outline-primary w-100 mb-2" (click)="loginSso(activeProvider)">
            Sign in with {{ activeProvider | uppercase }}
          </button>
        </div>

        <div *ngIf="error" class="alert alert-danger mt-3 py-2 small">{{ error }}</div>
      </div>
    </div>
  `
})
export class AuthComponent implements OnInit {
  activeProvider = 'form';
  isSignup = true;
  email = 'merchant@example.com';
  password = 'password123';

  windowsUsername = '';
  ssoEmail = 'user@domain.com';
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getAuthConfig().subscribe({
      next: (res) => {
        if (res?.activeProvider) {
          this.activeProvider = res.activeProvider;
        }
      },
      error: () => {
        this.activeProvider = 'form';
      }
    });
  }

  isSsoProvider(provider: string): boolean {
    return ['azure', 'amazon', 'auth0', 'google', 'microsoft', 'github', 'apple'].includes(provider);
  }

  submitForm() {
    this.error = '';
    const obs = this.isSignup ? this.api.signup(this.email, this.password) : this.api.login(this.email, this.password);
    obs.subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (err) => this.error = err.error?.error || 'Authentication failed'
    });
  }

  loginWindows() {
    this.error = '';
    this.api.windowsAuth(this.windowsUsername || undefined).subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (err) => this.error = err.error?.error || 'Windows authentication failed'
    });
  }

  loginSso(provider: string) {
    this.error = '';
    this.api.ssoAuth(provider, this.ssoEmail).subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (err) => this.error = err.error?.error || 'SSO authentication failed'
    });
  }
}
