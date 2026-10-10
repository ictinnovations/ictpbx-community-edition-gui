import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GatewayService } from './gateway.service';
import { Gateway } from './gateway';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NbWindowService, NbWindowRef } from '@nebular/theme';

@Component({
  selector: 'ngx-gateway-list',
  templateUrl: './gateway-list.component.html',
  styleUrls: ['./gateway-list.component.scss'],
})
export class GatewayListComponent implements OnInit {

  displayedColumns = ['gateway', 'username', 'realm', 'register', 'profile', 'enabled', 'operations'];
  dataSource: MatTableDataSource<Gateway>;
  deleteUuid: string;
  private windowRef: NbWindowRef;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(private service: GatewayService, private router: Router, private windowService: NbWindowService) {}

  ngOnInit() { this.loadList(); }

  loadList() {
    this.service.getList().then(data => {
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
