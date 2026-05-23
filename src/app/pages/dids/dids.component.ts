import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DidsService } from './dids.service';
import { Did, FaxAccount } from './dids';

@Component({
  selector: 'ngx-dids',
  templateUrl: './dids.component.html',
})
export class DidsComponent implements OnInit {

  dids: Did[] = [];
  faxAccounts: FaxAccount[] = [];
  tenants: any[] = [];
  isAdmin = false;
  isError = false;
  isSuccess = false;
  errorText = '';
  successText = '';

  assigningId: number | null = null;
  assignAccountId: number | null = null;

  assigningTenantId: number | null = null;
  newTenantId: number | null = null;

  constructor(private service: DidsService, private router: Router) {
    this.isAdmin = localStorage.getItem('is_admin') === '1';
  }

  ngOnInit() {
    this.load();
    if (this.isAdmin) {
      this.service.listTenants().then(list => this.tenants = list).catch(() => {});
    }
  }

  private parseError(err: any): string {
    try {
      const body = typeof err._body === 'string' ? JSON.parse(err._body) : (err._body || {});
      return body?.error?.message || body?.message || 'Operation failed';
    } catch { return 'Operation failed'; }
  }

  load() {
    this.service.list().then(list => this.dids = list).catch(err => {
      this.isError = true;
      this.errorText = this.parseError(err);
    });
  }

  edit(did: Did) {
    this.router.navigate(['/pages/dids/dids', did.id]);
  }

  delete(did: Did) {
    if (!confirm(`Delete DID ${did.phone}?`)) return;
    this.service.delete(did.id).then(() => {
      this.isSuccess = true; this.successText = 'DID deleted.';
      this.load();
    }).catch(err => { this.isError = true; this.errorText = this.parseError(err); });
  }

  startAssign(did: Did) {
    this.assigningId = did.id;
    this.assignAccountId = did.fax_account_id || null;
    this.service.listFaxAccounts().then(list => this.faxAccounts = list).catch(() => { this.faxAccounts = []; });
  }

  cancelAssign() {
    this.assigningId = null;
    this.assignAccountId = null;
  }

  saveAssign(did: Did) {
    this.service.assign(did.id, this.assignAccountId).then(() => {
      this.isSuccess = true; this.successText = 'DID assigned successfully.';
      this.assigningId = null;
      this.load();
    }).catch(err => { this.isError = true; this.errorText = this.parseError(err); });
  }

  startAssignTenant(did: Did) {
    this.assigningTenantId = did.id;
    this.newTenantId = did.tenant_id || null;
  }

  cancelAssignTenant() {
    this.assigningTenantId = null;
    this.newTenantId = null;
  }

  saveAssignTenant(did: Did) {
    this.service.update({ ...did, tenant_id: this.newTenantId }).then(() => {
      const t = this.tenants.find(x => x.tenant_id === this.newTenantId);
      did.tenant_id = this.newTenantId;
      did.tenant_name = t ? t.company : String(this.newTenantId);
      did.fax_account_id = null;
      did.fax_account_name = null;
      this.isSuccess = true; this.successText = 'DID reassigned to new tenant.';
      setTimeout(() => this.isSuccess = false, 4000);
      this.cancelAssignTenant();
    }).catch(err => {
      this.isError = true; this.errorText = this.parseError(err);
      setTimeout(() => this.isError = false, 5000);
    });
  }
}
