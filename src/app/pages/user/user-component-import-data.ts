import { Component } from '@angular/core';
import { AUserService } from './user.service';
import { Router, ActivatedRoute } from '@angular/router';
import * as Papa from 'papaparse';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-user-import-data-component',
  templateUrl: './user-import-data.html',
  styleUrls: ['./user-component.scss'],
})

export class UserImportDataComponent {

  constructor(private user_service: AUserService, private route: ActivatedRoute, private router: Router, private app_service: AppService) {
    this.permissions = [
      { id: "send_fax", name: "Send Fax" },
      { id: "receive_fax", name: "Receive Fax" },
      { id: "email_to_fax", name: "Email to Fax" },
      { id: "fax_to_email", name: "Fax to Email" },
      { id: "personalize_fax", name: "Personalize Fax" }
    ];
  }

  unsupportedErr: any = false;

  headers: string[] = [];
  rows: any[] = [];
  permissions: any[] = [];
  tenants: any;
  select_permissions: any = 'send_fax,receive_fax,fax_to_email,email_to_fax,personalize_fax';
  mapping: { [key: string]: string } = {};
  setmapped: any[] = [];
  tenant_id: any = 0;
  transformedRows: any = [];
  total_progress: any = 0;
  loading = false;
  uploaded_result = false;
  selectedValues: any = [];
  failedCount: any = 0;
  successCount: any = 0;
  totalCount: any = 0;
  failedRows: any = [];
  ngOnInit(): void {
    this.getAllTenants();
  }

  getAllTenants() {
    this.user_service.get_TenantList().then(response => {
      this.tenants = response;
      this.tenants.forEach(element => {
        element.state = null;
      });
    })
  }

  // onFileSelected(event: any) {
  //   const file = event.target.files[0];
  //   Papa.parse(file, {
  //     header: true,
  //     skipEmptyLines: true,
  //     complete: (result) => {
  //       this.headers = result.meta.fields || [];
  //       this.rows = result.data;
  //       this.headers.forEach(header => {
  //         this.selectedValues[header] = "";
  //       });
  //     }
  //   });
  // }
  onFileSelected(event: any) {
  const input = event.target as HTMLInputElement;
  const file = event.target.files[0];

  if (!file) return;

  // Check if the file is a CSV
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (fileExtension !== 'csv') {
    input.value = '';
    this.unsupportedErr = true;
    this.headers = [];
    this.rows = [];
    alert('Only CSV files are allowed!');
    return;
  } else {
    this.unsupportedErr = false;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      this.headers = result.meta.fields || [];
      this.rows = result.data;
      this.headers.forEach(header => {
        this.selectedValues[header] = "";
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
    if (col !== 'ignore') {
      this.mapping[field] = col;
    } else {
      delete this.mapping[field];
    }
    this.applyMapping()
  }

  onPermissionChange(permission: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!this.select_permissions.split(",").includes(permission)) {
        this.select_permissions = this.select_permissions
          ? this.select_permissions + "," + permission
          : permission;
      }
    } else {
      let arr = this.select_permissions.split(",").filter(p => p !== permission);
      this.select_permissions = arr.join(",");
    }
    this.setmapped.forEach(sm => {
      sm.user_permission = this.select_permissions;
    });
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
      mapped['user_permission'] = this.select_permissions;
      mapped['tenant_id'] = this.tenant_id;
      return mapped;
    })
    return this.setmapped
  }

  // async send_data() {
  //   this.loading = true;
  //   var total = this.setmapped.length;
  //   var progress = 0;
  //   try {
  //     await Promise.all(
  //       this.setmapped.map(async row => {
  //         await this.user_service.add_User(row);
  //         progress++;
  //         this.total_progress = Math.round((progress / total) * 100);
  //       })
  //     );
  //     this.loading = false;
  //     this.router.navigate(['../../../'], { relativeTo: this.route });
  //   } catch (err) {
  //     this.loading = false;
  //     console.error('Error sending data:', err);
  //   }
  // }

  downloadFailedCSV() {
    if (!this.failedRows || this.failedRows.length === 0) {
      alert("No failed entries to download.");
      return;
    }

    // Extract headers from object keys
    const headers = Object.keys(this.failedRows[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(","));

    // Add each failed row
    for (const row of this.failedRows) {
      const values = headers.map(h => JSON.stringify(row[h] ?? ""));
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");

    // Create download link
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
          var user_id = await this.user_service.add_User(row);
          await this.user_service.setRole(user_id, '1')
          this.successCount++;
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