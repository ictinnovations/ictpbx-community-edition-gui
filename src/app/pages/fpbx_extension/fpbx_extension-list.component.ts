import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FpbxExtensionService } from './fpbx_extension.service';
import { FpbxExtensionDatabase } from './fpbx_extension-database.component';
import { FpbxExtensionDataSource } from './fpbx_extension-datasource.component';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-fpbx-extension-list',
  templateUrl: './fpbx_extension-list.component.html',
  styleUrls: ['./fpbx_extension-list.component.scss'],
})
export class FpbxExtensionListComponent implements OnInit {

  displayedColumns: string[] = [];
  dataSource: FpbxExtensionDataSource | null;
  length = 0;
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;


  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    private service: FpbxExtensionService,
    private router: Router,
    private windowService: NbWindowService,
    private app_service: AppService,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
      this.displayedColumns = ['extension', 'effective_caller_id_name', 'effective_caller_id_number', 'call_timeout', 'enabled', 'linked_username', 'tenant_name', 'fax_email', 'operations'];
    } else {
      this.displayedColumns = ['extension', 'effective_caller_id_name', 'effective_caller_id_number', 'call_timeout', 'enabled', 'linked_username', 'fax_email', 'operations'];
    }
    this.loadList();
  }

  loadList() {
    this.service.getList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.dataSource = new FpbxExtensionDataSource(new FpbxExtensionDatabase(data), this.sort, this.paginator);
    });
  }

  openDeleteDialog(uuid: string, tmpl) {
    this.deleteUuid = uuid;
    this.windowRef = this.windowService.open(tmpl, { title: 'Confirm Delete' });
  }

  confirmDelete() {
    this.service.delete(this.deleteUuid).then(() => {
      if (this.windowRef) this.windowRef.close();
      this.loadList();
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }

}
