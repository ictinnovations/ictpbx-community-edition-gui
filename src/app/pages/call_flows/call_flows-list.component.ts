import { Component, OnInit } from '@angular/core';
import { CallFlowService } from './call_flow.service';
import { CallFlow } from './call_flow';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-call-flows-list',
  templateUrl: './call_flows-list.component.html',
})
export class CallFlowsListComponent implements OnInit {

  items: CallFlow[] = [];
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  constructor(private service: CallFlowService, private windowService: NbWindowService, private app: AppService) {}

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
    }).catch(err => {
      if (this.windowRef) this.windowRef.close();
      try {
        const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
        this.app.errors = body?.error?.message || 'Error while deleting Call Flow';
      } catch { this.app.errors = 'Error while deleting Call Flow'; }
      setTimeout(() => { this.app.errors = ''; }, 8000);
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
