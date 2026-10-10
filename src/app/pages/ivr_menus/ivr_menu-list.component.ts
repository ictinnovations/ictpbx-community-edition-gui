import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IvrMenuService } from './ivr_menu.service';
import { IvrMenu } from './ivr_menu';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-ivr-menu-list',
  templateUrl: './ivr_menu-list.component.html',
  styleUrls: ['./ivr_menu-list.component.scss'],
})
export class IvrMenuListComponent implements OnInit {

  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<IvrMenu>;
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    private service: IvrMenuService,
    private router: Router,
    private windowService: NbWindowService,
    private app_service: AppService,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
      this.displayedColumns = ['ivr_menu_extension', 'ivr_menu_name', 'ivr_menu_language', 'ivr_menu_enabled', 'tenant_name', 'operations'];
    } else {
      this.displayedColumns = ['ivr_menu_extension', 'ivr_menu_name', 'ivr_menu_language', 'ivr_menu_enabled', 'operations'];
    }
    this.loadList();
  }

  loadList() {
    this.service.getList(this.selectedTenant).then(data => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
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
    }).catch(err => {
      if (this.windowRef) this.windowRef.close();
      try {
        const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
        this.app_service.errors = body?.error?.message || 'Error while deleting IVR Menu';
      } catch { this.app_service.errors = 'Error while deleting IVR Menu'; }
      setTimeout(() => { this.app_service.errors = ''; }, 8000);
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
