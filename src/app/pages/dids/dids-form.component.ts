import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DidsService } from './dids.service';
import { Did } from './dids';

@Component({
  selector: 'ngx-dids-form',
  templateUrl: './dids-form.component.html',
})
export class DidsFormComponent implements OnInit {

  did: Did = new Did();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  tenants: any[] = [];

  private parseError(err: any): string {
    try {
      const body = typeof err._body === 'string' ? JSON.parse(err._body) : (err._body || {});
      return body?.error?.message || body?.message || 'Operation failed';
    } catch { return 'Operation failed'; }
  }

  constructor(
    private service: DidsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.service.listTenants().then(list => this.tenants = list).catch(() => {});
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.service.get(+id).then(data => this.did = data).catch(err => {
        this.isError = true;
        this.errorText = [this.parseError(err)];
      });
    }
  }

  save() {
    this.errorText = [];
    if (!this.did.phone) { this.errorText.push('Phone number is required'); }
    if (!this.did.tenant_id) { this.errorText.push('Tenant is required'); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit ? this.service.update(this.did) : this.service.create(this.did);
    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/dids/dids']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [this.parseError(err)];
    });
  }
}
