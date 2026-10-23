import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080';
  private tokenKey = 'pay_proxy_token';
  private apiKeyKey = 'pay_proxy_api_key';

  public token$ = new BehaviorSubject<string | null>(localStorage.getItem(this.tokenKey));
  public apiKey$ = new BehaviorSubject<string | null>(localStorage.getItem(this.apiKeyKey));

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem(this.tokenKey);
    const apiKey = localStorage.getItem(this.apiKeyKey);

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else if (apiKey) {
      headers = headers.set('X-API-Key', apiKey);
    }
    return headers;
  }

  getAuthConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v1/auth/config`);
  }

  signup(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/auth/signup`, { email, password }).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.token$.next(res.token);
        }
        if (res.apiKey) {
          localStorage.setItem(this.apiKeyKey, res.apiKey);
          this.apiKey$.next(res.apiKey);
        }
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.token$.next(res.token);
        }
      })
    );
  }

  windowsAuth(username?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/auth/windows`, { username }).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.token$.next(res.token);
        }
      })
    );
  }

  ssoAuth(provider: string, email: string, ssoToken?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/auth/sso`, { provider, email, ssoToken }).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.token$.next(res.token);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.apiKeyKey);
    this.token$.next(null);
    this.apiKey$.next(null);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v1/auth/me`, { headers: this.getHeaders() });
  }

  generateApiKey(): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/auth/keys/generate`, {}, { headers: this.getHeaders() }).pipe(
      tap((res: any) => {
        if (res.apiKey) {
          localStorage.setItem(this.apiKeyKey, res.apiKey);
          this.apiKey$.next(res.apiKey);
        }
      })
    );
  }

  getGateways(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v1/gateways`, { headers: this.getHeaders() });
  }

  addGateway(provider: string, credentials: Record<string, string>): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/gateways`, { provider, credentials }, { headers: this.getHeaders() });
  }

  getBillingBalance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v1/billing/balance`, { headers: this.getHeaders() });
  }

  getBillingLedger(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v1/billing/ledger`, { headers: this.getHeaders() });
  }

  getCharges(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v1/charges`, { headers: this.getHeaders() });
  }

  createCharge(chargeData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/charge`, chargeData, { headers: this.getHeaders() });
  }

  searchDocs(query: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/docs/search`, { query }, { headers: this.getHeaders() });
  }
}
