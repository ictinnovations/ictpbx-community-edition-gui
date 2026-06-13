import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import 'rxjs/add/operator/toPromise';

import { DID } from './did';
import { DIDService } from './did.service';
import { User } from '../user/user';
import { AUserService } from '../user/user.service';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-assign-did-component',
  templateUrl: './assign-did-component.html',
  styleUrls: ['./assign-did-component.scss'],
})

export class AssignDIDComponent implements OnInit {

  constructor(private route: ActivatedRoute, private did_service: DIDService,
    private router: Router, private user_service: AUserService, private app_service: AppService) { }

  did: DID = new DID;
  form1: any = {};
  id: any = null;
  user: User[] = [];
  selectedUser: User;

  ngOnInit(): void {
    this.getUserList();
    this.route.params.subscribe(params => {
      this.id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.did_service.get_DIDData(this.id).then(data => {
          this.did = data;
        });
      }
    });
  }

  getUserList() {
    this.user_service.get_UserList().then(data => {
      this.user = data;
    });
  }

  forwardDID(): void {
    this.did_service.unassign_DID(this.did).then(response => {
      this.did_service.assign_DID(this.did).then(data => {
        this.app_service.INFO = "Please reforward that DID number to Email Address / ATA Extension From My DIDs menu";
        this.clearMsg();
        this.router.navigate(['../../../did'], { relativeTo: this.route });
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
    }, 5000);
  }


  get selectedUsr() {
    return this.selectedUser;
  }

  set selectedUsr(value) {
    this.selectedUser = value;
    this.did.user_id = this.selectedUser.user_id;
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
