import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-docs-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <h2 class="mb-4">Documentation & AI RAG Search</h2>

      <div class="card p-3 shadow-sm bg-white mb-4">
        <div class="input-group">
          <input type="text" class="form-control" [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="Ask AI / Search docs (e.g., Getting Started, Stripe, Webhooks)...">
          <button class="btn btn-primary" (click)="search()">Search Docs</button>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-12" *ngFor="let doc of results">
          <div class="card shadow-sm bg-white">
            <div class="card-header bg-white fw-bold text-primary">{{ doc.title }}</div>
            <div class="card-body">
              <pre class="bg-light p-3 rounded" style="white-space: pre-wrap; font-family: inherit;">{{ doc.content }}</pre>
            </div>
          </div>
        </div>

        <div class="col-12 text-center text-muted py-5" *ngIf="results.length === 0">
          No documentation matches found for "{{ searchQuery }}".
        </div>
      </div>
    </div>
  `
})
export class DocsSearchComponent implements OnInit {
  searchQuery = 'Getting Started';
  results: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.search();
  }

  search() {
    if (!this.searchQuery) return;
    this.api.searchDocs(this.searchQuery).subscribe(res => {
      this.results = res.results || [];
    });
  }
}
