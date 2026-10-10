import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { RingGroupService } from './ring_groups.service';
import { RingGroupDatabase } from './ring_groups-database.component';
import { RingGroupDataSource } from './ring_groups-datasource.component';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-ring-groups-list',
  templateUrl: './ring_groups-component.html',
  styleUrls: ['./ring_groups-component.scss'],
})
export class FormsRingGroupsComponent implements OnInit {

  displayedColumns: string[] = [];
  dataSource: RingGroupDataSource | null;
  length = 0;
  err_code: string;
  err_message: string;
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    private service: RingGroupService,
    private router: Router,
    private windowService: NbWindowService,
    private app_service: AppService,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
      this.displayedColumns = ['ring_group_name', 'ring_group_extension', 'ring_group_strategy', 'ring_group_call_timeout', 'ring_group_enabled', 'tenant_name', 'operations'];
    } else {
      this.displayedColumns = ['ring_group_name', 'ring_group_extension', 'ring_group_strategy', 'ring_group_call_timeout', 'ring_group_enabled', 'operations'];
    }
    this.loadList();
  }

  loadList() {
    this.service.get_RingGroupList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.dataSource = new RingGroupDataSource(new RingGroupDatabase(data), this.sort, this.paginator);
    });
  }

  openDeleteDialog(uuid: string, tmpl) {
    this.deleteUuid = uuid;
    this.windowRef = this.windowService.open(tmpl, { title: 'Confirm Delete' });
  }

  confirmDelete() {
    this.service.delete_RingGroup(this.deleteUuid).then(() => {
      if (this.windowRef) this.windowRef.close();
      this.loadList();
    }).catch(err => {
      if (this.windowRef) this.windowRef.close();
      try {
        const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
        this.app_service.errors = body?.error?.message || 'Error while deleting Ring Group';
      } catch { this.app_service.errors = 'Error while deleting Ring Group'; }
      setTimeout(() => { this.app_service.errors = ''; }, 8000);
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
