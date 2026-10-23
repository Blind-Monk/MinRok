import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth.component';
import { DashboardOverviewComponent } from './components/dashboard-overview.component';
import { GatewaysComponent } from './components/gateways.component';
import { DocsSearchComponent } from './components/docs-search.component';

export const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'overview', component: DashboardOverviewComponent },
  { path: 'gateways', component: GatewaysComponent },
  { path: 'docs', component: DocsSearchComponent },
  { path: '**', redirectTo: 'overview' }
];
