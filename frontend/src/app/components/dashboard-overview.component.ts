import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <h2 class="mb-4">Merchant Dashboard Overview</h2>

      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card card-metric p-3 shadow-sm bg-white">
            <div class="text-muted small">Daily Free Requests</div>
            <div class="fs-3 fw-bold text-primary">{{ balanceInfo.daily_requests_count || 0 }} / 20</div>
            <div class="small text-success">20 free requests/day reset daily</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card card-metric p-3 shadow-sm bg-white" style="border-left-color: #10b981;">
            <div class="text-muted small">Prepaid Balance</div>
            <div class="fs-3 fw-bold text-success">{{ (balanceInfo.balance_microcents || 0) / 1000000 | number:'1.2-4' }} USD</div>
            <div class="small text-muted">{{ balanceInfo.balance_microcents || 0 }} microcents</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card card-metric p-3 shadow-sm bg-white" style="border-left-color: #f59e0b;">
            <div class="text-muted small">Total Credits Used</div>
            <div class="fs-3 fw-bold text-warning">{{ (balanceInfo.used_microcents || 0) / 1000000 | number:'1.2-4' }} USD</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card card-metric p-3 shadow-sm bg-white" style="border-left-color: #8b5cf6;">
            <div class="text-muted small">Auth Mode</div>
            <div class="fs-5 fw-bold text-dark">{{ merchant.auth_provider || 'API Key / JWT' }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card p-3 shadow-sm bg-white">
            <h5 class="card-title">API Key Credentials</h5>
            <p class="text-muted small">Your active API key prefix: <code>{{ merchant.api_key_prefix || 'Not generated' }}</code></p>
            <button class="btn btn-sm btn-outline-primary" (click)="generateApiKey()">Generate New API Key</button>
            <div *ngIf="newApiKey" class="alert alert-success mt-2 mb-0 py-2 small">
              <strong>Your API Key:</strong> <code>{{ newApiKey }}</code> (Copy it now, shown only once)
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card p-3 shadow-sm bg-white">
            <h5 class="card-title">Create Test Charge</h5>
            <div class="row g-2">
              <div class="col-4"><input class="form-control form-control-sm" [(ngModel)]="chargeData.amount" type="number" placeholder="Amount"></div>
              <div class="col-4"><input class="form-control form-control-sm" [(ngModel)]="chargeData.currency" placeholder="USD/INR"></div>
              <div class="col-4"><input class="form-control form-control-sm" [(ngModel)]="chargeData.provider" placeholder="Provider"></div>
            </div>
            <button class="btn btn-sm btn-success mt-2" (click)="createCharge()">Simulate Charge</button>
            <div *ngIf="chargeResult" class="alert alert-info mt-2 mb-0 py-2 small">
              Ref: {{ chargeResult.providerReference }} | URL: <a [href]="chargeResult.checkoutUrl" target="_blank">{{ chargeResult.checkoutUrl }}</a>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm bg-white">
        <div class="card-header bg-white fw-bold">Recent Payment Requests</div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>Provider</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Free Tier</th>
                <th>Cost</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of charges">
                <td><small><code>{{ c.id ? c.id.substring(0, 8) + '...' : '' }}</code></small></td>
                <td><span class="badge bg-secondary">{{ c.provider }}</span></td>
                <td>{{ c.amount }}</td>
                <td>{{ c.currency }}</td>
                <td><span class="badge" [ngClass]="c.status === 'succeeded' ? 'bg-success' : 'bg-warning'">{{ c.status }}</span></td>
                <td><span class="badge" [ngClass]="c.is_free_tier ? 'bg-info' : 'bg-secondary'">{{ c.is_free_tier ? 'Free Tier' : 'Metered' }}</span></td>
                <td>{{ c.cost_microcents }} µ¢</td>
                <td><small>{{ c.created_at | date:'short' }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DashboardOverviewComponent implements OnInit {
  balanceInfo: any = {};
  merchant: any = {};
  charges: any[] = [];
  newApiKey: string = '';
  chargeResult: any = null;

  chargeData = {
    amount: 10,
    currency: 'USD',
    description: 'Test Charge from Dashboard',
    returnUrl: 'http://localhost:4200/complete',
    provider: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.getMe().subscribe(res => this.merchant = res.merchant || {});
    this.api.getBillingBalance().subscribe(res => this.balanceInfo = res);
    this.api.getCharges().subscribe(res => this.charges = res.charges || []);
  }

  generateApiKey() {
    this.api.generateApiKey().subscribe(res => {
      this.newApiKey = res.apiKey;
      this.loadData();
    });
  }

  createCharge() {
    this.api.createCharge(this.chargeData).subscribe(res => {
      this.chargeResult = res;
      this.loadData();
    });
  }
}
