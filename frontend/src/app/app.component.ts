import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="d-flex">
      <div class="sidebar p-3 d-flex flex-column" style="width: 250px;">
        <h4 class="text-white mb-4 px-2">⚡ PayProxy</h4>
        <nav class="nav flex-column mb-auto">
          <a routerLink="/overview" routerLinkActive="active"><i class="bi bi-speedometer2 me-2"></i> Overview</a>
          <a routerLink="/gateways" routerLinkActive="active"><i class="bi bi-wallet2 me-2"></i> Gateways</a>
          <a routerLink="/docs" routerLinkActive="active"><i class="bi bi-book me-2"></i> Documentation</a>
        </nav>
        <div class="pt-3 border-top border-secondary">
          <a routerLink="/auth" class="text-danger" (click)="logout()">Log Out</a>
        </div>
      </div>

      <div class="flex-grow-1 p-4 bg-light" style="min-height: 100vh;">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AppComponent {
  constructor(private api: ApiService) {}

  logout() {
    this.api.logout();
  }
}
