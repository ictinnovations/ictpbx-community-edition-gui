import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { VoicemailService } from './voicemails.service';
import { VoicemailDatabase } from './voicemails-database.component';
import { VoicemailDataSource } from './voicemails-datasource.component';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-voicemails-list',
  templateUrl: './voicemails-component.html',
  styleUrls: ['./voicemails-component.scss'],
})
export class FormsVoicemailsComponent implements OnInit {

  displayedColumns: string[] = [];
  dataSource: VoicemailDataSource | null;
  length = 0;
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    private service: VoicemailService,
    private router: Router,
    private windowService: NbWindowService,
    private app_service: AppService,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
      this.displayedColumns = ['voicemail_id', 'voicemail_mail_to', 'greeting_count', 'voicemail_enabled', 'tenant_name', 'operations'];
    } else {
      this.displayedColumns = ['voicemail_id', 'voicemail_mail_to', 'greeting_count', 'voicemail_enabled', 'operations'];
    }
    this.loadList();
  }

  loadList() {
    this.service.get_VoicemailList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.dataSource = new VoicemailDataSource(new VoicemailDatabase(data), this.sort, this.paginator);
    });
  }

  openDeleteDialog(uuid: string, tmpl) {
    this.deleteUuid = uuid;
    this.windowRef = this.windowService.open(tmpl, { title: 'Confirm Delete' });
  }

  confirmDelete() {
    this.service.delete_Voicemail(this.deleteUuid).then(() => {
      if (this.windowRef) this.windowRef.close();
      this.loadList();
    }).catch(err => {
      if (this.windowRef) this.windowRef.close();
      try {
        const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
        this.app_service.errors = body?.error?.message || 'Error while deleting Voicemail';
      } catch { this.app_service.errors = 'Error while deleting Voicemail'; }
      setTimeout(() => { this.app_service.errors = ''; }, 8000);
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
