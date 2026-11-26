import { Component, OnInit } from '@angular/core';
import { CallBlockService } from './call_block.service';
import { CallBlock } from './call_block';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-call-block-list',
  templateUrl: './call_block-list.component.html',
})
export class CallBlockListComponent implements OnInit {

  items: CallBlock[] = [];
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  constructor(private service: CallBlockService, private windowService: NbWindowService, private app: AppService) {}

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
