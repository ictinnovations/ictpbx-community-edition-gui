import { Component, OnInit } from '@angular/core';
import { UsersCdrService } from './users-cdr.service';
import { AUserService } from '../user/user.service';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'ngx-users-cdr',
  templateUrl: './users-cdr.component.html',
  styleUrls: ['./users-cdr.component.scss']
})
export class UsersCdrComponent implements OnInit {

  constructor( private usersCDR: UsersCdrService, private user_service: AUserService) { }

  tenants: any;
  aUsersCdr: any;

//search filter keys
  tenant_id: number = 0;
  extension: string = '';
  status: any;
  filter = '';

  displayedColumns: string[] = [
  'ID',
  'Time',
  'CallerNumber',
  'destination',
  'Duration',
  'HangupCause',
  'Domain',
   ];

  ngOnInit(): void {
    this.getUsers_cdr();
    this.getAllTenants();
  }


    range = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });


  getUsers_cdr( ){
    this.usersCDR.usersCDR_list().then(response=> {
      this.aUsersCdr = response;
    })
  }

  getAllTenants() {
    this.user_service.get_TenantList().then(response => {
      this.tenants = response;
    })
  }

  onStatusSelect(value){
    if(value != 0) this.status = value;
    else this.status = null;
  }

  onTenantSelect(value) {
    if (value != 0) this.tenant_id = value;
    else this.tenant_id = 0;
  }

  filterList() {
    this.setFilter();
    this.usersCDR.get_filteredList(this.filter).then(response => {
      this.aUsersCdr = response;
    })
  }

  setFilter() {
    this.filter = '';
    if (this.tenant_id) this.filter += `&tenant_id=${this.tenant_id}`;
    if (this.extension && this.extension.trim()) this.filter += `&extension=${encodeURIComponent(this.extension.trim())}`;
    if (this.status) this.filter += `&hangup_cause=${this.status}`;
    const start = this.range.get('start').value;
    const end = this.range.get('end').value;
    if (start) this.filter += `&date_from=${this.fmtDate(start)}`;
    if (end) this.filter += `&date_to=${this.fmtDate(end)}`;
  }

  fmtDate(d: any): string {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = ('0' + (dt.getMonth() + 1)).slice(-2);
    const day = ('0' + dt.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }

  exportCDR( ): void {
      this.setFilter();
      this.usersCDR.exportCDR(this.filter);
    }
  }
