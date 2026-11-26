import { Component, OnInit } from '@angular/core';
import { FollowMeService } from './follow_me.service';
import { FollowMe } from './follow_me';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-follow-me-list',
  templateUrl: './follow_me-list.component.html',
})
export class FollowMeListComponent implements OnInit {

  items: FollowMe[] = [];
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  constructor(private service: FollowMeService, private windowService: NbWindowService, private app: AppService) {}

  ngOnInit() {
    if (this.isAdmin) this.app.loadTenants().then(d => this.tenants = d);
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
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
