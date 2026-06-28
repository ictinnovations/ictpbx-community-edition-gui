import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { InboundRouteService } from './inbound_route.service';
import { InboundRoute } from './inbound_route';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-inbound-route-list',
  templateUrl: './inbound_route-list.component.html',
  styleUrls: ['./inbound_route-list.component.scss'],
})
export class InboundRouteListComponent implements OnInit {

  displayedColumns = ['destination_number', 'destination_data', 'destination_order', 'destination_enabled', 'operations'];
  dataSource: MatTableDataSource<InboundRoute>;
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(private service: InboundRouteService, private router: Router, private windowService: NbWindowService, private app: AppService) {}

  ngOnInit() {
    if (this.isAdmin) this.app.loadTenants().then(d => this.tenants = d);
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
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
