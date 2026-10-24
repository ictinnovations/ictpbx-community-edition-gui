import { Component, OnInit, ViewChild } from '@angular/core';
import { DID } from './did';
import { DIDService } from './did.service';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../user/user';
import { AUserService } from '../user/user.service';

@Component({
  selector: 'ngx-batch-did-component',
  templateUrl: './batch-did-component.html',
  styleUrls: ['./batch-did-component.scss'],
})

export class BatchDIDComponent {

  constructor(private did_service: DIDService, private router: Router, private route: ActivatedRoute, private user_service : AUserService) {
    this.did.active = 1;
  }

  did: DID= new DID;
  user: User = new User;
  user_id: any= null;
  userArray: User[] = [];
  is_admin: any = 0;
  is_tenant: any = 0;
  auser: any;
  public isAdmin = false;
  public isTenant = false;
  public isUser = false;

  ngOnInit() {
    this.user_id = localStorage.getItem("aid");
    this.isAdmin = (localStorage.getItem('is_admin') === "1") ? true : false;
    this.isTenant = (localStorage.getItem('is_tenant') === "1") ? true : false;
    this.isUser = (this.isAdmin == false && this.isTenant == false) ? true : false;
    
  
    if (!this.isUser) {
      this.getUserlist();
    }
  }


  addDID() {
    for (let i = this.did.range_from; i <= this.did.range_to; i++) {
      this.did.phone = i;
      this.did.username = this.did.phone;
      this.did.first_name = this.did.title + ' ' + i;
      this.did_service.add_DID(this.did).then(response => {
      });
      if ( i == this.did.range_to) {
        this.router.navigate(['../../did'], {relativeTo: this.route});
      }
    }
    this.getUserlist();
  }
  getUserlist() {
    this.user_service.get_UserList().then(data => {
        this.userArray = data;
        this.user.user_id = this.userArray[this.userArray.length - 1].user_id;
    }).catch(error => {
        console.error("Error fetching user list:", error);
    });
}

onSelectAccount(value) {
    if (value !== 0) {
        this.user.user_id = value;
    } else {
        this.user.user_id = undefined;
    }
}
}

