import { Component, OnInit } from '@angular/core';
import { TimeConditionService } from './time_condition.service';
import { TimeCondition } from './time_condition';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-time-conditions-list',
  templateUrl: './time_conditions-list.component.html',
})
export class TimeConditionsListComponent implements OnInit {

  items: TimeCondition[] = [];
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  constructor(private service: TimeConditionService, private windowService: NbWindowService, private app: AppService) {}

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
