import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-billing-quota',
  templateUrl: './billing-quota.component.html',
  styleUrls: ['./billing-quota.component.scss'],
})
export class BillingQuotaComponent implements OnInit {
  isAdmin = localStorage.getItem('is_admin') === '1';
  isTenant = localStorage.getItem('is_tenant') === '1';
  loading = true;
  error = '';

  quotas: any[] = [];
  tenants: any[] = [];
  selectedTenant = 0;

  // Map resource_id (from PbxQuota constants) → permission key in usr.user_permission.
  private static readonly RESOURCE_PERMISSION_MAP: { [id: number]: string } = {
    7:  'ring_groups',
    8:  'call_queues',
    9:  'voicemails',
    10: 'conferences',
    11: 'music_on_hold',
    15: 'fpbx_extension',
    16: 'devices',
    17: 'ivr_menus',
  };

  constructor(private http: HttpClient, private appService: AppService) {}

  ngOnInit() {
    if (this.isAdmin) this.loadTenants();
    this.loadQuota();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('copy_token') ||
      JSON.parse(localStorage.getItem('auth_app_token') || '{}').value;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadTenants() {
    this.http.get<any[]>(`${this.appService.apiUrl}/tenants`, { headers: this.headers() })
      .subscribe({ next: d => this.tenants = d, error: () => {} });
  }

  loadQuota() {
    this.loading = true;
    this.error = '';
    let url = this.appService.apiUrlBillingQuota;
    if (this.isAdmin && this.selectedTenant > 0) url += `?tenant_id=${this.selectedTenant}`;

    this.http.get<any[]>(url, { headers: this.headers() }).subscribe({
      next: data => { this.loading = false; this.quotas = this.filterByPermission(data); },
      error: err => { this.loading = false; this.error = err?.error?.message || 'Failed to load quota data'; },
    });
  }

  // Admin and tenant-admin see every quota; regular users see only the quotas
  // for resources they have a matching permission for.
  private filterByPermission(rows: any[]): any[] {
    if (this.isAdmin || this.isTenant) return rows;
    const perms = (localStorage.getItem('permission') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    if (!perms.length) return [];
    return rows.filter(r => {
      const key = BillingQuotaComponent.RESOURCE_PERMISSION_MAP[r.resource_id];
      return !key || perms.includes(key);
    });
  }

  barStatus(pct: number): string {
    if (pct >= 90) return 'danger';
    if (pct >= 70) return 'warning';
    return 'success';
  }
}
