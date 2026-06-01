import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceService } from './device.service';
import { DeviceDatabase } from './device-database.component';
import { DeviceDataSource } from './device-datasource.component';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
})
export class DeviceListComponent implements OnInit {

  displayedColumns = ['device_label', 'device_address', 'device_vendor', 'device_model', 'device_enabled', 'operations'];

  formatMac(mac: string): string {
    if (!mac) return '';
    const m = mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
    if (m.length !== 12) return mac;
    return m.match(/.{2}/g).join(':');
  }
  dataSource: DeviceDataSource | null;
  length = 0;
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    private service: DeviceService,
    private router: Router,
    private windowService: NbWindowService,
    private app_service: AppService,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
    }
    this.loadList();
  }

  loadList() {
    this.service.getList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.dataSource = new DeviceDataSource(new DeviceDatabase(data), this.sort, this.paginator);
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
