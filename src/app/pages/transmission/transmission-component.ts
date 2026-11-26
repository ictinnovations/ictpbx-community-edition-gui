import { NgModule, Component, EventEmitter, Input, Output, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TransmissionService } from './transmission.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { TransmissionDatabase } from './transmission-database.component';
import { TransmissionDataSource } from './transmission-datasource.component';
import { AppService } from '../../../app/app.service';


import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';


@Component({
  selector: 'ngx-transmission-component',
  templateUrl: './transmission-component.html',
  styleUrls: ['./transmission-component.scss'],
})

export class FormsTransmissionComponent implements OnInit {
  constructor(
    private transmission_service: TransmissionService,
    private app_service: AppService,
  ) { }

  aTransmission: TransmissionDataSource | null;
  public showSelected: boolean;
  public length: number;
  public abc: any;
  public def: any;
  public err_code: string;
  public err_message: string;
  public appval;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  displayedColumns= ['ID', 'contact_id', 'status'];

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;


  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
    }
    this.getTransmissionlist();
  }

  getTransmissionlist() {
    this.transmission_service.get_OutFaxTransmissionList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.aTransmission = new TransmissionDataSource(new TransmissionDatabase( data ), this.sort, this.paginator);
    });
  }
}
