import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CallQueueService } from './call_queues.service';
import { CallQueueDatabase } from './call_queues-database.component';
import { CallQueueDataSource } from './call_queues-datasource.component';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-call-queues-list',
  templateUrl: './call_queues-component.html',
  styleUrls: ['./call_queues-component.scss'],
})
export class FormsCallQueuesComponent implements OnInit {

  displayedColumns: string[] = [];
  dataSource: CallQueueDataSource | null;
  length = 0;
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    private service: CallQueueService,
    private router: Router,
    private windowService: NbWindowService,
    private app_service: AppService,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
      this.displayedColumns = ['queue_name', 'queue_extension', 'queue_strategy', 'agent_count', 'queue_enabled', 'tenant_name', 'operations'];
    } else {
      this.displayedColumns = ['queue_name', 'queue_extension', 'queue_strategy', 'agent_count', 'queue_enabled', 'operations'];
    }
    this.loadList();
  }

  loadList() {
    this.service.get_CallQueueList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.dataSource = new CallQueueDataSource(new CallQueueDatabase(data), this.sort, this.paginator);
    });
  }

  openDeleteDialog(uuid: string, tmpl) {
    this.deleteUuid = uuid;
    this.windowRef = this.windowService.open(tmpl, { title: 'Confirm Delete' });
  }

  confirmDelete() {
    this.service.delete_CallQueue(this.deleteUuid).then(() => {
      if (this.windowRef) this.windowRef.close();
      this.loadList();
    }).catch(err => {
      if (this.windowRef) this.windowRef.close();
      try {
        const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
        this.app_service.errors = body?.error?.message || 'Error while deleting Call Queue';
      } catch { this.app_service.errors = 'Error while deleting Call Queue'; }
      setTimeout(() => { this.app_service.errors = ''; }, 8000);
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
