import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-subscription',
  templateUrl: './subscription.component.html',
})
export class SubscriptionComponent implements OnInit {
  loading  = true;
  error    = '';
  success  = '';

  subscriptions: any[] = [];
  packages: any[]      = [];

  editRow: { [tenantId: number]: number } = {};
  saving:  { [tenantId: number]: boolean } = {};
  toggling: { [subscriptionId: number]: boolean } = {};

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
    this.http.get<any[]>(this.appService.apiUrlSubscriptions, { headers: this.headers() }).subscribe({
      next: subs => {
        this.subscriptions = subs;
        this.http.get<any[]>(`${this.appService.apiUrlSubscriptions}/packages`, { headers: this.headers() }).subscribe({
          next: pkgs => { this.packages = pkgs; this.loading = false; },
          error: () => { this.loading = false; },
        });
      },
      error: e => { this.error = e?.error?.message || 'Failed to load subscriptions'; this.loading = false; },
    });
  }

  startEdit(sub: any) {
    this.editRow[sub.tenant_id] = Number(sub.package_id);
  }

  cancelEdit(tenantId: number) {
    delete this.editRow[tenantId];
  }

  assign(sub: any) {
    const pkg_id = this.editRow[sub.tenant_id];
    if (!pkg_id) return;
    this.saving[sub.tenant_id] = true;
    this.error   = '';
    this.success = '';

    this.http.post(this.appService.apiUrlSubscriptions,
      { tenant_id: sub.tenant_id, package_id: pkg_id },
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        delete this.editRow[sub.tenant_id];
        this.saving[sub.tenant_id] = false;
        this.success = `Package updated for ${sub.company}.`;
        this.load();
      },
      error: e => {
        this.saving[sub.tenant_id] = false;
        this.error = e?.error?.message || 'Failed to update subscription';
      },
    });
  }

  suspend(sub: any) {
    this.toggling[sub.subscription_id] = true;
    this.error = '';
    this.http.put(`${this.appService.apiUrlSubscriptions}/${sub.subscription_id}/suspend`, {},
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.toggling[sub.subscription_id] = false;
        this.success = `Subscription suspended for ${sub.company}.`;
        this.load();
      },
      error: e => {
        this.toggling[sub.subscription_id] = false;
        this.error = e?.error?.message || 'Failed to suspend subscription';
      },
    });
  }

  activate(sub: any) {
    this.toggling[sub.subscription_id] = true;
    this.error = '';
    this.http.put(`${this.appService.apiUrlSubscriptions}/${sub.subscription_id}/activate`, {},
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.toggling[sub.subscription_id] = false;
        this.success = `Subscription activated for ${sub.company}.`;
        this.load();
      },
      error: e => {
        this.toggling[sub.subscription_id] = false;
        this.error = e?.error?.message || 'Failed to activate subscription';
      },
    });
  }

  formatDate(ts: any): string {
    if (!ts) return '—';
    return new Date(Number(ts) * 1000).toLocaleDateString();
  }

  packageName(id: number): string {
    return this.packages.find(p => Number(p.package_id) === Number(id))?.name || `#${id}`;
  }
}
