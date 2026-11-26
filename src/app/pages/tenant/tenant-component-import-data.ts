import { Component } from '@angular/core';
import { TenantService } from './tenant.service';
import { Router, ActivatedRoute } from '@angular/router';
import * as Papa from 'papaparse';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-tenant-import-data-component',
  templateUrl: './tenant-import-data.html',
  styleUrls: ['./tenant-component.scss'],
})

export class TenantImportDataComponent {

  constructor(private tenant_service: TenantService, private app_service: AppService, private route: ActivatedRoute, private router: Router) {
    this.permissions = [
      { id: "mfa_enabled", name: "Enable MFA" },
      { id: "password_expiry", name: "Password Expiry" },
    ];
  }


  unsupportedErr: any = false;

  headers: string[] = [];
  rows: any[] = [];
  permissions: any[] = [];
  tenants: any;
  select_permissions: any = ['mfa_enabled', 'password_expiry'];
  mapping: { [key: string]: string } = {};
  setmapped: any[] = [];
  tenant_id: any = 0;
  transformedRows: any = [];
  total_progress: any = 0;
  uploaded_result = false;
  loading = false;
  active_tenant = true;
  selectedValues: any = [];
  failedCount: any = 0;
  successCount: any = 0;
  totalCount: any = 0;
  failedRows: any = [];

  ngOnInit(): void {
    this.getAllTenants();

  }

  getAllTenants() {
    this.tenant_service.get_TenantList().then(response => {
      this.tenants = response;
      this.tenants.forEach(element => {
        element.state = null;
      });
    })
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        this.headers = result.meta.fields || [];
        this.rows = result.data;
        this.headers.forEach(header => {
          this.selectedValues[header] = "";   // empty means "Please Choose"
        });
      }
    });
  }

  setMapping(field: string, event: Event) {
    var col = (event.target as HTMLSelectElement).value;
    const duplicateKey = Object.keys(this.selectedValues).find(
      key => key !== field && this.selectedValues[key] === col
    );
    if (duplicateKey) {
      this.selectedValues[duplicateKey] = "";
    }
    this.selectedValues[field] = col;
    if (col !== '') {
      this.mapping[field] = col;
    } else {
      delete this.mapping[field];
    }
    this.applyMapping()
  }


  onPermissionChange(permission: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      if (!this.select_permissions.includes(permission)) {
        this.select_permissions.push(permission);
      }
    } else {
      this.select_permissions = this.select_permissions.filter(
        p => p !== permission
      );
    }
    this.setmapped.forEach(sm => {
      sm.user_permission = this.select_permissions;
    });
    console.log(this.select_permissions);
  }
  onTenantChange(event: Event) {
    this.tenant_id = (event.target as HTMLInputElement).value;
    this.setmapped.map(sm => {
      sm.tenant_id = this.tenant_id;
    })
  }
  applyMapping() {
    this.setmapped = this.rows.map(row => {
      const mapped: any = {};
      Object.keys(this.mapping).forEach(col => {
        const field = this.mapping[col];
        mapped[field] = row[col];
      })
      mapped['permissions'] = this.select_permissions;
      mapped['min_retention'] = 21;
      mapped['max_retention'] = 31;
      mapped['daily_limit'] = -1;
      mapped['monthly_limit'] = -1;
      mapped['active'] = this.active_tenant;
      return mapped;
    })
    return this.setmapped
  }
  activetenant(check: boolean) {
    this.active_tenant = check;
    this.applyMapping();
  }


  downloadFailedCSV() {
    if (!this.failedRows || this.failedRows.length === 0) {
      alert("No failed entries to download.");
      return;
    }
    const headers = Object.keys(this.failedRows[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));
    for (const row of this.failedRows) {
      const values = headers.map(h => JSON.stringify(row[h] ?? ""));
      csvRows.push(values.join(","));
    }
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "failed_entries.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async send_data() {
    this.loading = true;
    const total = this.setmapped.length;
    let progress = 0;
    this.failedCount = 0;
    this.successCount = 0;
    this.totalCount = 0;
    this.failedRows = [];

    try {
      for (const row of this.setmapped) {
        this.totalCount++;
        try {
          this.successCount++;
          await this.tenant_service.add_Tenant(row);
        } catch (err) {
          this.failedRows.push(row);
          this.failedCount++;
          console.error("Row failed:", row, err);
        }
        progress++;
        this.total_progress = Math.round((progress / total) * 100);
      }
      this.loading = false;
      this.uploaded_result = true;
      if (this.failedCount == 0) {
        this.app_service.success_message = 'User Data Uploaded Successfully';
        this.clearMsg();
        this.router.navigate(['../../../'], { relativeTo: this.route });
      }
    } catch (err) {
      this.loading = false;
      console.error("Unexpected error:", err);
    }
  }
  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }


}