import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppService } from '../../app.service';

const RESOURCE_LABELS: { [id: number]: string } = {
  7:  'Ring Groups',
  8:  'Call Queues',
  9:  'Voicemail Boxes',
  10: 'Conference Rooms',
  11: 'Music on Hold',
  12: 'Voice Minutes/mo',
  13: 'Fax Pages/mo',
  14: 'Conference Mins/mo',
  15: 'Extensions',
  16: 'Devices',
  17: 'IVR Menus',
};

const INTERVAL_OPTIONS = [
  { label: 'Monthly',   value: 2629800 },
  { label: 'Quarterly', value: 7889400 },
  { label: 'Yearly',    value: 31557600 },
];

@Component({
  selector: 'ngx-package',
  templateUrl: './package.component.html',
})
export class PackageComponent implements OnInit {
  loading = true;
  saving  = false;
  error   = '';
  success = '';

  packages: any[] = [];
  plans: any[]    = [];
  intervalOptions = INTERVAL_OPTIONS;
  resourceIds     = Object.keys(RESOURCE_LABELS).map(Number);
  resourceLabels  = RESOURCE_LABELS;

  showForm  = false;
  editId: number | null = null;
  form: any = this._blankForm();

  constructor(private http: HttpClient, private appService: AppService) {}

  ngOnInit() {
    this.load();
    this.http.get<any[]>(`${this.appService.apiUrl}/plans`, { headers: this.headers() })
      .subscribe({ next: d => this.plans = d, error: () => {} });
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('copy_token') ||
      JSON.parse(localStorage.getItem('auth_app_token') || '{}').value;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  load() {
    this.loading = true;
    this.http.get<any[]>(this.appService.apiUrlPackages, { headers: this.headers() }).subscribe({
      next: d => { this.packages = d; this.loading = false; },
      error: e => { this.error = e?.error?.message || 'Failed to load packages'; this.loading = false; },
    });
  }

  openNew() {
    this.editId  = null;
    this.form    = this._blankForm();
    this.showForm = true;
    this.success  = '';
    this.error    = '';
  }

  openEdit(pkg: any) {
    this.editId = pkg.package_id;
    this.form = {
      name:             pkg.name,
      description:      pkg.description || '',
      package_interval: Number(pkg.package_interval),
      plan_id:          Number(pkg.plan_id),
      resources:        this.resourceIds.map(rid => {
        const r = (pkg.resources || []).find((x: any) => x.resource_id === rid);
        return { resource_id: rid, quota_limit: r ? r.quota_limit : 0 };
      }),
    };
    this.showForm = true;
    this.success  = '';
    this.error    = '';
  }

  save() {
    this.saving = true;
    this.error  = '';
    const req$ = this.editId
      ? this.http.put(`${this.appService.apiUrlPackages}/${this.editId}`, this.form, { headers: this.headers() })
      : this.http.post(this.appService.apiUrlPackages, this.form, { headers: this.headers() });

    req$.subscribe({
      next: () => {
        this.saving   = false;
        this.showForm = false;
        this.success  = this.editId ? 'Package updated.' : 'Package created.';
        this.load();
      },
      error: e => { this.saving = false; this.error = e?.error?.message || 'Save failed'; },
    });
  }

  remove(pkg: any) {
    if (!confirm(`Delete package "${pkg.name}"? This cannot be undone.`)) return;
    this.http.delete(`${this.appService.apiUrlPackages}/${pkg.package_id}`, { headers: this.headers() })
      .subscribe({
        next: () => { this.success = 'Package deleted.'; this.load(); },
        error: e => { this.error = e?.error?.message || 'Delete failed'; },
      });
  }

  cancel() { this.showForm = false; this.error = ''; }

  intervalLabel(v: number): string {
    return INTERVAL_OPTIONS.find(o => o.value === Number(v))?.label || `${Math.round(Number(v) / 86400)}d`;
  }

  resourceLimit(pkg: any, rid: number): number {
    const r = (pkg.resources || []).find((x: any) => x.resource_id === rid);
    return r ? r.quota_limit : 0;
  }

  private _blankForm() {
    return {
      name: '', description: '', package_interval: 2629800, plan_id: 1,
      resources: this.resourceIds.map(rid => ({ resource_id: rid, quota_limit: 0 })),
    };
  }
}
