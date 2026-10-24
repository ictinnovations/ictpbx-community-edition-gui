import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { IncomingNumber } from './incoming_number';
import { IncomingNumberService } from './incoming_number.service';
import { DID } from '../did/did';
import { DIDService } from '../did/did.service';
import 'rxjs/add/operator/toPromise';
import { User } from '../user/user';
import { AUserService } from '../user/user.service';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-assign-incoming-component',
  templateUrl: './assign-incoming_number-component.html',
  styleUrls: ['./assign-incoming_number-component.scss'],
})

export class AssignIncomingNumberComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private in_number_service: IncomingNumberService,
    private router: Router, private user_service: AUserService, private did_service: DIDService, private app_service: AppService) { }

  did: DID = new DID;
  form1: any = {};
  incomingNumber: IncomingNumber = new IncomingNumber;
  id: any = null;
  user: User[] = [];
  selectedUser: User;
  searchText: string = '';
  filteredUsers = [...this.user];

  ngOnInit(): void {
    this.getUserList();
    this.route.params.subscribe(params => {
      this.id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.in_number_service.get_Data(this.id).then(data => {
          this.incomingNumber = data;
        });
      }
    });
  }

  getUserList() {
    this.user_service.get_UserList().then(data => {
      this.user = data;
      this.filteredUsers = data;
    });
  }

  validateValue() {
    const lower = this.searchText?.trim().toLowerCase() || "";

    this.filteredUsers = this.user.filter(c =>
      String(c.username).toLowerCase().includes(lower) ||
      String(c.company).toLowerCase().includes(lower)
    );
  }

  get selectedUsr() {
    return this.selectedUser;
  }

  set selectedUsr(value) {
    this.selectedUser = value;
    this.incomingNumber.user_id = this.selectedUser.user_id;
  }

  SetUsr(value) {
    this.selectedUser = value;
    this.incomingNumber.user_id = this.selectedUser.user_id;
  }

  forwardDID(): void {
    this.did_service.unassign_DID(this.incomingNumber).then(response => {
      this.did_service.assign_DID(this.incomingNumber).then(data => {
        this.app_service.success_message = 'DID assignment completed successfully!';
        this.app_service.INFO = 'Please reforward that DID Number to Email Address / ATA Extension From My DID Menu!';
        this.clearMsg();
        this.router.navigate(['../../../incoming_number'], { relativeTo: this.route });
      });
    })
      .catch(err => {
        this.app_service.errors = 'Error occurred while assigning DID';
        this.clearMsg();
      });
  }
  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
      this.app_service.INFO = '';
    }, 5000);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
