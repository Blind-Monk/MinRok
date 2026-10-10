import { Component } from '@angular/core';
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
      <div class="card p-4 shadow-sm bg-white" style="width: 400px;">
        <h3 class="card-title text-center mb-4">{{ isSignup ? 'Merchant Signup' : 'Merchant Login' }}</h3>

        <div class="mb-3">
          <label class="form-label">Email address</label>
          <input type="email" class="form-control" [(ngModel)]="email" placeholder="merchant@company.com">
        </div>

        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" [(ngModel)]="password" placeholder="••••••••">
        </div>

        <button class="btn btn-primary w-100 mb-3" (click)="submit()">{{ isSignup ? 'Sign Up (500 INR Free Credits)' : 'Log In' }}</button>

        <div class="text-center">
          <a href="javascript:void(0)" (click)="isSignup = !isSignup" class="small text-muted">
            {{ isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up" }}
          </a>
        </div>

        <div *ngIf="error" class="alert alert-danger mt-3 py-2 small">{{ error }}</div>
      </div>
    </div>
  `
})
export class AuthComponent {
  isSignup = true;
  email = 'merchant@example.com';
  password = 'password123';
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  submit() {
    this.error = '';
    const obs = this.isSignup ? this.api.signup(this.email, this.password) : this.api.login(this.email, this.password);
    obs.subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (err) => this.error = err.error?.error || 'Authentication failed'
    });
  }
}
