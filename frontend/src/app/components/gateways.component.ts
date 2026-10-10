import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-gateways',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <h2 class="mb-4">Gateway Credentials Management</h2>

      <div class="row g-4">
        <div class="col-md-5">
          <div class="card p-3 shadow-sm bg-white">
            <h5 class="card-title mb-3">Configure Gateway Credentials</h5>

            <div class="mb-3">
              <label class="form-label">Select Provider</label>
              <select class="form-select" [(ngModel)]="selectedProvider" (change)="onProviderChange()">
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="razorpay">Razorpay</option>
                <option value="binance_pay">Binance Pay</option>
                <option value="coinbase_commerce">Coinbase Commerce</option>
                <option value="moonpay">MoonPay</option>
              </select>
            </div>

            <div *ngIf="selectedProvider === 'stripe'">
              <div class="mb-2">
                <label class="form-label small">Secret Key</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['secretKey']" type="password">
              </div>
              <div class="mb-2">
                <label class="form-label small">Webhook Secret</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['webhookSecret']" type="password">
              </div>
            </div>

            <div *ngIf="selectedProvider === 'paypal'">
              <div class="mb-2">
                <label class="form-label small">Client ID</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['clientId']">
              </div>
              <div class="mb-2">
                <label class="form-label small">Client Secret</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['clientSecret']" type="password">
              </div>
            </div>

            <div *ngIf="selectedProvider === 'razorpay'">
              <div class="mb-2">
                <label class="form-label small">Key ID</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['keyId']">
              </div>
              <div class="mb-2">
                <label class="form-label small">Key Secret</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['keySecret']" type="password">
              </div>
            </div>

            <div *ngIf="selectedProvider === 'binance_pay'">
              <div class="mb-2">
                <label class="form-label small">API Key</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['apiKey']">
              </div>
              <div class="mb-2">
                <label class="form-label small">Secret Key</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['secretKey']" type="password">
              </div>
            </div>

            <div *ngIf="selectedProvider === 'coinbase_commerce'">
              <div class="mb-2">
                <label class="form-label small">API Key</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['apiKey']">
              </div>
            </div>

            <div *ngIf="selectedProvider === 'moonpay'">
              <div class="mb-2">
                <label class="form-label small">Publishable Key</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['publishableKey']">
              </div>
              <div class="mb-2">
                <label class="form-label small">Secret Key</label>
                <input class="form-control form-control-sm" [(ngModel)]="credentials['secretKey']" type="password">
              </div>
            </div>

            <button class="btn btn-primary btn-sm mt-3" (click)="saveGateway()">Encrypt & Save Credentials</button>
            <div *ngIf="msg" class="alert alert-info mt-2 small">{{ msg }}</div>
          </div>
        </div>

        <div class="col-md-7">
          <div class="card shadow-sm bg-white">
            <div class="card-header bg-white fw-bold">Active Merchant Gateways</div>
            <ul class="list-group list-group-flush">
              <li *ngFor="let g of gateways" class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <span class="badge bg-primary text-uppercase me-2">{{ g.provider }}</span>
                  <span class="text-success small">AES-256-GCM Encrypted</span>
                </div>
                <small class="text-muted">Added: {{ g.created_at | date:'shortDate' }}</small>
              </li>
              <li *ngIf="gateways.length === 0" class="list-group-item text-muted text-center py-4">
                No gateways configured yet.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GatewaysComponent implements OnInit {
  gateways: any[] = [];
  selectedProvider = 'stripe';
  credentials: Record<string, string> = { secretKey: 'sk_test_mock', webhookSecret: 'whsec_mock' };
  msg = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadGateways();
  }

  loadGateways() {
    this.api.getGateways().subscribe(res => this.gateways = res.gateways || []);
  }

  onProviderChange() {
    this.credentials = { secretKey: 'sk_test_mock', apiKey: 'mock_api_key', keyId: 'mock_key_id' };
  }

  saveGateway() {
    this.api.addGateway(this.selectedProvider, this.credentials).subscribe({
      next: () => {
        this.msg = 'Credentials encrypted with AES-256-GCM and saved successfully!';
        this.loadGateways();
      },
      error: (err) => this.msg = 'Error saving credentials: ' + (err.error?.error || 'failed')
    });
  }
}
