import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppService } from '../../app.service';

interface ApiKey {
  api_key_id: number;
  name: string;
  key_prefix: string;
  rate_limit: number;
  active: string;
  expires: string;
  last_used: string;
  created: string;
}

@Component({
  selector: 'ngx-api-keys',
  templateUrl: './api-keys.component.html',
  styleUrls: ['./api-keys.component.scss'],
})
export class ApiKeysComponent implements OnInit {
  keys: ApiKey[] = [];
  loading = false;
  saving = false;
  error = '';

  showForm = false;
  newName = '';
  newRateLimit = 60;
  newExpires = '';

  // Only ever populated right after a create — the server cannot return it again.
  createdKey = '';
  copied = false;

  constructor(private http: HttpClient, private appService: AppService) {}

  ngOnInit() {
    this.load();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('copy_token') ||
      JSON.parse(localStorage.getItem('auth_app_token') || '{}').value;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  load() {
    this.loading = true;
    this.http.get<ApiKey[]>(this.appService.apiUrlApiKeys, { headers: this.headers() })
      .subscribe({
        next: d => { this.loading = false; this.keys = d || []; },
        error: e => { this.loading = false; this.error = this.msg(e); },
      });
  }

  startNew() {
    this.showForm = true;
    this.createdKey = '';
    this.copied = false;
    this.error = '';
    this.newName = '';
    this.newRateLimit = 60;
    this.newExpires = '';
  }

  cancelNew() {
    this.showForm = false;
    this.error = '';
  }

  create() {
    const name = this.newName.trim();
    if (!name) {
      this.error = 'A name is required';
      return;
    }
    this.saving = true;
    this.error = '';
    const payload: any = { name, rate_limit: Number(this.newRateLimit) || 0 };
    if (this.newExpires) payload.expires = this.newExpires;

    this.http.post<any>(this.appService.apiUrlApiKeys, payload, { headers: this.headers() })
      .subscribe({
        next: d => {
          this.saving = false;
          this.showForm = false;
          this.createdKey = d?.api_key || '';
          this.copied = false;
          this.load();
        },
        error: e => { this.saving = false; this.error = this.msg(e); },
      });
  }

  toggleActive(key: ApiKey) {
    const active = Number(key.active) === 1 ? 0 : 1;
    this.http.put<any>(`${this.appService.apiUrlApiKeys}/${key.api_key_id}`, { active },
      { headers: this.headers() })
      .subscribe({
        next: () => this.load(),
        error: e => this.error = this.msg(e),
      });
  }

  remove(key: ApiKey) {
    if (!confirm(`Permanently revoke API key "${key.name}"? Any integration using it will stop working.`)) {
      return;
    }
    this.http.delete<any>(`${this.appService.apiUrlApiKeys}/${key.api_key_id}`, { headers: this.headers() })
      .subscribe({
        next: () => this.load(),
        error: e => this.error = this.msg(e),
      });
  }

  copyKey() {
    navigator.clipboard?.writeText(this.createdKey).then(() => this.copied = true).catch(() => {});
  }

  dismissKey() {
    this.createdKey = '';
    this.copied = false;
  }

  isActive(key: ApiKey): boolean {
    return Number(key.active) === 1;
  }

  private msg(e: any): string {
    return e?.error?.error?.message || e?.error?.message || 'Request failed';
  }
}
