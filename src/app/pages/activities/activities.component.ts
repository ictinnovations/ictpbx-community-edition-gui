import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ActivitiesDataSource } from './activities-datasource';
import { ActivitiesDatabase } from './activities-database';
import { AUserService } from '../user/user.service';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { CompleterData, CompleterItem } from 'ng2-completer';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { Router } from '@angular/router';
import { activity } from './activity';
import { Observable } from 'rxjs/Rx';



import { MatTableModule } from '@angular/material/table';
import { ModalComponent } from '../../modal.component';

@Component({
  selector: 'ngx-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss']
})
export class ActivitiesComponent implements OnInit {
  constructor(private user_service: AUserService,
    private modalService: NgbModal) { }


  aactivities: ActivitiesDataSource | null;
  length: number = 0;
  tenants: any;
  users: any;
  tenant_id: number = 0;
  user_id: number = 0;
  closeResult: any;
  activityArray: activity[] = [];
  actArray: any = [];
  filter = '';
  tenant_idd = localStorage.getItem('tid');
  admin: any = 0;
  is_tenant: any = 0;
  dataService: CompleterData;
  displayedColumns: string[] = ['user_id', 'username', 'ip_address', 'activities', 'date'];
  lastpage: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;




  ngOnInit(): void {
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    this.admin = Number(localStorage.getItem('is_admin'));
    this.getactivitieslist(10, 0);
    this.getAllUsers(this.tenant_id);
    if (this.admin == 1) this.getAllTenants();
    this.gettotalrows();
  }

  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getactivitieslist(event.pageSize, 0, 1)
      }
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
      if (event.previousPageIndex == event.pageIndex) {
      }
      else if (event.previousPageIndex < event.pageIndex) {
        var pageweight = event.pageIndex * event.pageSize;
        if (pageweight >= this.length) {
          this.lastpage = event.pageIndex;
          var pageindex = event.pageIndex + 1;
          this.getactivitieslist(event.pageSize, pageindex);
        }
      }
    });
  }

  gettotalrows() {
    this.user_service.getactivitiestotalrows().then(data => {
      this.paginator.length = data;
    })
  }

  range = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

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

  openSearchModal(searchTemplate) {
    const modalRef = this.modalService.open(searchTemplate);
    modalRef.result.then(
      (result) => {
      },
      (reason) => {
      }
    );
  }

  onUserSelect(value) {
    if (value != 0) this.user_id = value;
    else this.user_id = 0;
  }

  onTenantSelect(value) {
    if (value != 0) this.tenant_id = value;
    else this.tenant_id = 0;
    this.user_id = 0;

    this.getAllUsers(this.tenant_id);
  }

  setFilter() {
    this.filter = '';
    if (this.range.value.start) this.filter += `&from=${(new Date(this.range.value.start).getTime() / 1000)}`;
    if (this.range.value.end) this.filter += `&to=${(new Date(this.range.value.end).getTime() / 1000)}`;
    if (this.tenant_id > 0) this.filter += `&tenant_id=${this.tenant_id}`;
    if (this.user_id > 0) this.filter += `&user_id=${this.user_id}`;
  }

  search(modal) {
    this.getactivitieslist();
    modal.close();
  }

  getactivitieslist(pageSize = null, pageIndex = null, reget = 0) {
    this.setFilter();
    this.user_service.get_ActivitiesList(this.filter, pageSize, pageIndex).then(data => {
      this.length += data.length;
      this.actArray = this.actArray.concat(data);

      if (this.filter != '') {
        this.length = data.length;
        this.paginator.length = data.length;
        this.pageIndex = 0;
        this.actArray = data;
      }

      this.aactivities = new ActivitiesDataSource(new ActivitiesDatabase(this.actArray), this.sort, this.paginator);
      if (this.filter == '' && reget == 0) {
        this.paginator.pageIndex = this.lastpage;
      }
      const sortState: Sort = { active: 'time_connect', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }

  exportact(): void {

    this.setFilter();
    this.user_service.exportact(this.filter);
  }

}



