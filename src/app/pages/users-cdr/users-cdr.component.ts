import { Component, OnInit } from '@angular/core';
import { UsersCdrService } from './users-cdr.service';
import { AUserService } from '../user/user.service';
import { ExtensionService } from '../extension/extension.service';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'ngx-users-cdr',
  templateUrl: './users-cdr.component.html',
  styleUrls: ['./users-cdr.component.scss']
})
export class UsersCdrComponent implements OnInit {

  constructor( private usersCDR: UsersCdrService, private user_service: AUserService, private extension_service: ExtensionService) { }

  extensions: any;
  tenants: any;
  users: any;
  aUsersCdr: any;

//search filter keys
  tenant_id: number = 0;
  user_id: number = 0;
  domain: any;
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
    this.getAllextensions();
    this.getAllTenants();
    this.getAllUsers();
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
  
  getAllextensions() {
    this.extension_service.get_ExtensionList().then(response => {
      console.log(response);
      this.extensions = response;
    })
  }
  
  getAllUsers(tenant = 0) {
    this.user_service.get_UserList(tenant).then(response => {
      this.users = response;
    })
  }
  
  getAllTenants() {
    this.user_service.get_TenantList().then(response => {
      this.tenants = response;
    })
  }

  
  onUserSelect(value) {
    if (value != 0) this.user_id = value;
    else this.user_id = 0;
  }
  
  onExtesionSelect(value) {
    if (value != 0) this.domain = value;
    else this.domain = null;
  }

  onStatusSelect(value){
    if(value != 0) this.status = value;
    else this.status = null;
  }
  
  onTenantSelect(value) {
    if (value != 0) this.tenant_id = value;
    else this.tenant_id = 0;
    this.getAllUsers(this.tenant_id);
    this.user_id = 0;
  }
  
  filterList() {
    this.setFilter();
    this.usersCDR.get_filteredList(this.filter).then(response => {
      this.aUsersCdr = response;
    })
  }
  
  setFilter() {
    this.filter = '';
    if (this.domain ) this.filter += `&domain=${this.domain}`;
    if (this.status ) this.filter += `&hangup_cause=${this.status}`;
    if (this.user_id ) this.filter += `&user_id=${this.user_id}`;
  }
  
  exportCDR( ): void {
      this.setFilter();
      this.usersCDR.exportCDR(this.filter);
    }
  }
