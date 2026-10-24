import { Component, OnInit } from '@angular/core';
import { MusicOnHoldService } from './music_on_hold.service';
import { MusicOnHold } from './music_on_hold';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-moh-list',
  templateUrl: './music_on_hold-list.component.html',
})
export class MusicOnHoldListComponent implements OnInit {

  items: MusicOnHold[] = [];
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  constructor(
    private service: MusicOnHoldService,
    private windowService: NbWindowService,
    private app_service: AppService,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
    }
    this.loadList();
  }

  loadList() { this.service.getList(this.selectedTenant).then(data => this.items = data || []); }

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
        this.app_service.errors = body?.error?.message || 'Error while deleting Music on Hold';
      } catch { this.app_service.errors = 'Error while deleting Music on Hold'; }
      setTimeout(() => { this.app_service.errors = ''; }, 8000);
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
