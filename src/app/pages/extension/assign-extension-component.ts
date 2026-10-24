import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import 'rxjs/add/operator/toPromise';

import { Extension } from './extension';
import { ExtensionService } from './extension.service';
import { User } from '../user/user';
import { AUserService } from '../user/user.service';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-assign-extension-component',
  templateUrl: './assign-extension-component.html',
  styleUrls: ['./assign-extension-component.scss'],
})

export class AssignExtensionComponent implements OnInit {

  constructor(private route: ActivatedRoute, private extension_service: ExtensionService,
  private router: Router, private user_service: AUserService, private app_service: AppService) { }

  extension: Extension = new Extension;
  form1: any= {};
  id: any= null;
  user: User[] = [];
  selectedUser: User;
  extension_info: any= null;

  ngOnInit(): void {
    this.getUserList();
    this.route.params.subscribe(params => {
      this.id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.extension_service.get_ExtensionData(this.id).then(data => {
          this.extension = data;
          this.extension_info = this.extension.username + " (" + this.extension.phone + ")";
        });
      }
    });
  }

  getUserList() {
    this.user_service.get_UserList().then(data => {
      this.user = data;
    });
  }

  forwardExtension(): void {
    this.extension_service.unassign_Extension(this.extension).then(response => {
      this.extension_service.assign_Extension(this.extension).then(data => {
        this.router.navigate(['../../../extension'], {relativeTo: this.route});
        this.app_service.success_message = 'Extension assignment completed successfully!';
        this.clearMsg();
      });
    })
    .catch(err => {
      this.app_service.errors = 'Error occurred while assigning Extention';
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
    this.extension.user_id = this.selectedUser.user_id;
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
