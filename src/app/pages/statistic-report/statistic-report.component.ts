
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AUserService } from '../user/user.service';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageEvent } from '@angular/material/paginator';
import { StatisticReport } from './statistic-report';
import { StatisticReportService } from './statistic-report.service';
import { StatisticReportDataSource } from './statistic-report-datasource.component';
import { StatisticReportDatabase } from './statistic-report-database.component';

@Component({
  selector: 'ngx-statistic-report',
  templateUrl: './statistic-report.component.html',
  styleUrls: ['./statistic-report.component.scss']
})
export class StatisticReportComponent implements OnInit {

  aStat: StatisticReportDataSource | null;
  tenants: any;
  users: any;
  accounts = [];
  selectedTags: any = [];
  statisticArray: any = [];
  tenant_id: number = 0;
  user_id: number = 0;
  direction: any;
  status: any;
  is_read: any = '';
  is_admin: any = 0;
  is_tenant: any = 0;
  tenantUID: any = 0;
  userUID: any = 0;
  filter = '';
  fullWidth: boolean = true;
  lastpage: number = 0;
  length: number = 0;
  pageSize: any = 10;
  pageIndex: any = 1;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('tagfilter', { static: false }) tagfilter: ElementRef;
  displayedColumns = ['time_connect', 'company', 'username', 'contact_phone', 'direction', 'account_phone', 'status', 'mapped_response', 'pages'];

  constructor(private stat_service: StatisticReportService, private user_service: AUserService) { }

  ngOnInit() {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    if (this.is_admin == 1) this.getAllTenants();
    if (this.is_admin == 0) this.tenant_id = Number(localStorage.getItem('tenant_id'));


    this.getAllUsers(this.tenant_id);
    this.getList(this.pageSize, this.pageIndex);
    this.getAllAccounts();
    this.gettotalrows();
  }

  range = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

  gettotalrows() {
    this.stat_service.gettotalnumberrows().then(data => {
      this.paginator.length = data;
    });
  }
  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getList(event.pageSize, 0, 1)
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


  getList(pageSize = null, pageIndex = null, reget = 0) {
    this.stat_service.get_CDRlist(null, pageSize, pageIndex).then(response => {
      this.length += response.length;
      this.statisticArray = this.statisticArray.concat(response);
      if (reget == 1) {
        this.length = response.length;
        this.statisticArray = response;
        this.paginator.pageIndex = 0;
      }
      this.aStat = new StatisticReportDataSource(new StatisticReportDatabase(this.statisticArray), this.sort, this.paginator);
      if (reget == 0) {
        this.paginator.pageIndex = this.lastpage;
      }
      //Sort the data automatically
      const sortState: Sort = { active: 'time_connect', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);

      // Observable for the filter
      fromEvent(this.tagfilter.nativeElement, 'keyup')
        .pipe(debounceTime(150),
          distinctUntilChanged())
        .subscribe(() => {
          if (!this.aStat) { return; }
          console.log(this.tagfilter.nativeElement.value);
          this.aStat.tagfilter = this.tagfilter.nativeElement.value;
        });
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

  async getAllAccounts() {

    try {
      const response = await this.stat_service.get_AccountList();
      response.forEach(tag => {
        if (tag) {
          if (tag['tags']) this.accounts.push(tag);
        }
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }

  filterList() {
    this.setFilter();
    this.stat_service.get_CDRlist(this.filter).then(response => {
      this.length = response.length;
      this.paginator.length = response.length;
      this.aStat = new StatisticReportDataSource(new StatisticReportDatabase(response), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = { active: 'time_connect', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
  }

  setFilter() {
    this.filter = '';
    if (this.range.value.start) this.filter += `&from=${(new Date(this.range.value.start).getTime() / 1000)}`;
    if (this.range.value.end) this.filter += `&to=${(new Date(this.range.value.end).getTime() / 1000)}`;
    if (this.tenant_id > 0) this.filter += `&tenant_id=${this.tenant_id}`;
    if (this.user_id > 0) this.filter += `&user_id=${this.user_id}`;
    if (this.direction) this.filter += `&direction=${this.direction}`;
    if (this.selectedTags > 0) this.filter += `&account_id=${this.selectedTags}`;
    if (this.status) this.filter += `&status=${this.status}`;
    if (this.is_read) this.filter += `&is_read=${this.is_read}`;
    if (this.tenantUID && this.tenantUID !== '0') {
      this.filter += `&tenant_unique_id=${this.tenantUID}`;
    }
    if (this.userUID && this.userUID !== '0') {
      this.filter += `&user_unique_id=${this.userUID}`;
    }
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
    console.log(this.user_id);
  }

  onDirectionSelect(value: string) {
    this.direction = value !== '' ? value : undefined;

    // Reset is_read if direction is not inbound
    if (this.direction !== 'inbound') {
      this.is_read = undefined;
    }
  }

  onStatusSelect(value) {
    this.status = value !== '' ? value : undefined;
  }

  onIsReadSelect(value: string) {
    this.is_read = value !== '' ? value : '';
  }

  onTagSelect(tag: any) {
    this.selectedTags;
  }

  exportCDR(monthly = false): void {
    if (monthly) this.stat_service.exportCDR(monthly);
    else {
      this.setFilter();
      this.stat_service.exportCDR(monthly, this.filter);
    }
  }

  getColor(response: string): string {
    if (!response) {
      return '#dc3545'; // Default color for null or undefined responses (Red)
    }

    switch (response.toLowerCase()) {
      case 'completed': return '#28a745'; // Green
      case 'busy': return '#fd7e14';     // Orange
      case 'no answer': return '#ffc107'; // Yellow
      case 'rejected': return '#dc3545';  // Red
      case 'no route': return '#6c757d';  // Grey
      default: return '#dc3545';          // Red (fallback)
    }
  }

}
