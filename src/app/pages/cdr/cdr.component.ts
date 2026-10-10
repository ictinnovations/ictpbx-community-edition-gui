
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AUserService } from '../user/user.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

import { CDR } from './cdr';
import { CDRService } from './cdr.service';
import { CDRDataSource } from './cdr-datasource.component';
import { CDRDatabase } from './cdr-database.component';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'ngx-cdr',
  styleUrls: ['./cdr.component.scss'],
  templateUrl: './cdr.component.html',
})

export class CDRComponent implements OnInit {

  aCdr: CDRDataSource | null;
  tenants: any;
  users: any;
  cdrArray: CDR[] = [];
  tenant_id: number = 0;
  user_id: number = 0;
  direction: any;
  lastpage: number = 0;
  pageIndex: any = 0;
  pageSize: any = 10;
  length: number = 0;
  is_admin: any = 0;
  is_tenant: any = 0;
  filter: any = '';

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  displayedColumns = ['start_time', 'direction', 'call_type', 'caller_number', 'destination', 'duration', 'billsec', 'hangup_cause', 'remote_ip'];
  hangup_cause: string = '';
  call_type: string = '';
  call_direction: string = '';

  constructor(private cdr_service: CDRService, private modalService: NgbModal, private user_service: AUserService) { }

  ngOnInit() {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    if (this.is_admin == 1) { this.getAllTenants(); this.gettotalrows(); this.getAllUsers(); }
    if (this.is_admin == 0) { this.tenant_id = Number(localStorage.getItem('tenant_id')); this.gettotalrows(this.tenant_id); this.getAllUsers(this.tenant_id); }
    this.getList(this.pageSize, this.pageIndex);
  }

  range = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });



  gettotalrows(tenant_id = 0) {
    this.cdr_service.gettotalrows(tenant_id).then(data => {
      this.paginator.length = data;
    });
  }

  openSearchModal(searchTemplate) {
    const modalRef = this.modalService.open(searchTemplate);
    modalRef.result.then(
      (result) => {
      },
      (reason) => {
      }
    );
  }

  filterList(modal) {
    this.setFilter();
    this.getList();
    modal.close();
  }

  setFilter() {
    this.filter = '';
    if (this.range.value.start) this.filter += `&start_date=${new Date(this.range.value.start).toISOString().slice(0, 19).replace('T', ' ')}`;
    if (this.range.value.end)   this.filter += `&end_date=${new Date(this.range.value.end).toISOString().slice(0, 19).replace('T', ' ')}`;
    if (this.hangup_cause)      this.filter += `&hangup_cause=${this.hangup_cause}`;
    if (this.call_type)         this.filter += `&call_type=${this.call_type}`;
    if (this.call_direction)    this.filter += `&direction=${this.call_direction}`;
  }

  onHangupSelect(value: string)    { this.hangup_cause   = value || ''; }
  onTypeSelect(value: string)      { this.call_type      = value || ''; }
  onDirectionSelect2(value: string){ this.call_direction = value || ''; }

  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getList(event.pageSize, 0);
      }
      this.pageSize = event.pageSize;
      this.pageIndex = event.pageIndex;
      if (event.previousPageIndex == event.pageIndex) {
        //   if (this.is_admin == 1) this.getUserlist(0, event.pageSize, event.pageIndex);
        // else this.getUserlist(this.auser.tenant_id , event.pageSize , event.pageIndex);
      }
      else if (event.previousPageIndex < event.pageIndex) {
        var pageweight = event.pageIndex * event.pageSize;
        this.lastpage = event.pageIndex;
        var pageindex = event.pageIndex + 1;
        if (pageweight == this.length) {
          this.getList(event.pageSize, pageindex);
        }
      }
    });
  }

  getList(pagesize = null, pageindex = null) {
    this.cdr_service.get_CDRlist(this.filter, pagesize, pageindex).then(response => {
      this.length += response.length;
      this.cdrArray = this.cdrArray.concat(response);
      if (pageindex == null && pagesize == null) {
        this.length = response.length;
        this.cdrArray = response;
      }
      this.aCdr = new CDRDataSource(new CDRDatabase(this.cdrArray), this.sort, this.paginator);
      this.paginator.pageIndex = this.lastpage;
      //Sort the data automatically
      const sortState: Sort = { active: 'start_time', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
  }

  getAllTenants() {
    this.user_service.get_TenantList().then(response => {
      this.tenants = response;
    })
  }

  getAllUsers(tenant = 0) {
    this.user_service.get_UserList(tenant).then(response => {
      this.users = response;
    })
  }

  onTenantSelect(value) {
    if (value != 0) this.tenant_id = value;
    else this.tenant_id = 0;
    this.getAllUsers(this.tenant_id);
    this.user_id = 0;
  }

  onUserSelect(value) {
    if (value != 0) this.user_id = value;
    else this.user_id = 0;
  }

  onDirectionSelect(value) {
    if (value != '') this.direction = value;
    else this.direction = undefined;
  }

  exportCDR(monthly = false): void {
    if (monthly) this.cdr_service.exportCDR(monthly);
    else {
      this.setFilter();
      this.cdr_service.exportCDR(monthly, this.filter);
    }
  }


}
