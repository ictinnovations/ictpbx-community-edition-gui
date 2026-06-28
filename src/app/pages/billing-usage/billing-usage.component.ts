import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-billing-usage',
  templateUrl: './billing-usage.component.html',
  styleUrls: ['./billing-usage.component.scss'],
})
export class BillingUsageComponent implements OnInit {
  isAdmin  = localStorage.getItem('is_admin')  === '1';
  isTenant = localStorage.getItem('is_tenant') === '1';
  loading = true;
  error = '';

  // single-tenant or own view
  usage: any = null;
  // admin all-tenants view
  allUsage: any[] = [];

  // end-user personal limits
  userDailyLimit: any = null;
  userMonthlyLimit: any = null;
  userPbxQuotas: any[] = [];

  private userPermissions: string[] = (localStorage.getItem('permission') || '').split(',').filter(Boolean);

  // admin tenant selector
  tenants: any[] = [];
  selectedTenant = 0;

  period = '';

  constructor(private http: HttpClient, private appService: AppService) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.loadTenants();
    } else if (this.isTenant) {
      this.loadUsage();
    } else {
      this.loadUsage();
      this.loadUserLimits();
    }
  }

  hasPermission(key: string): boolean {
    return this.userPermissions.includes(key);
  }

  loadUserLimits() {
    const userId = localStorage.getItem('aid');
    if (!userId) return;
    this.http.get<any>(`${this.appService.apiUrlUsers}/${userId}`, { headers: this.headers() })
      .subscribe({
        next: u => {
          this.userDailyLimit   = u.daily_limit   ?? null;
          this.userMonthlyLimit = u.monthly_limit ?? null;
          this.userPbxQuotas = [
            { name: 'Extensions',      value: u.quota_extensions,   permKey: 'fpbx_extension' },
            { name: 'Devices',         value: u.quota_devices,       permKey: 'devices' },
            { name: 'Ring Groups',     value: u.quota_ring_groups,   permKey: 'ring_groups' },
            { name: 'Call Queues',     value: u.quota_call_queues,   permKey: 'call_queues' },
            { name: 'IVR Menus',       value: u.quota_ivr_menus,     permKey: 'ivr_menus' },
            { name: 'Voicemail Boxes', value: u.quota_voicemail,     permKey: 'voicemails' },
            { name: 'Conferences',     value: u.quota_conference,    permKey: 'conferences' },
            { name: 'Music on Hold',   value: u.quota_music_on_hold, permKey: 'music_on_hold' },
          ].filter(q => this.hasPermission(q.permKey) && q.value !== null && q.value !== undefined);
        },
        error: () => {},
      });
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('copy_token') ||
      JSON.parse(localStorage.getItem('auth_app_token') || '{}').value;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadTenants() {
    this.http.get<any[]>(`${this.appService.apiUrl}/tenants`, { headers: this.headers() })
      .subscribe({ next: d => this.tenants = d, error: () => {} });
    this.loadUsage();
  }

  loadUsage() {
    this.loading = true;
    this.error = '';
    let url = this.appService.apiUrlBillingUsage;
    const params: string[] = [];
    if (this.period) params.push(`period=${this.period}`);
    if (this.isAdmin && this.selectedTenant > 0) params.push(`tenant_id=${this.selectedTenant}`);
    if (params.length) url += '?' + params.join('&');

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: data => {
        this.loading = false;
        if (Array.isArray(data)) {
          this.allUsage = data;
          this.usage = null;
        } else {
          this.usage = data;
          this.allUsage = [];
        }
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load usage data';
      },
    });
  }

  voicePercent(row: any): number {
    if (!row?.voice_limit || row.voice_limit <= 0) return 0;
    return Math.min(100, Math.round((row.voice_minutes_used / row.voice_limit) * 100));
  }

  faxPercent(row: any): number {
    if (!row?.fax_limit || row.fax_limit <= 0) return 0;
    return Math.min(100, Math.round((row.fax_pages_used / row.fax_limit) * 100));
  }

  barColor(pct: number): string {
    if (pct >= 90) return 'danger';
    if (pct >= 70) return 'warning';
    return 'success';
  }
}
