import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { User } from '../user/user';
import { AUserService } from '../user/user.service';
import { Extension, Settings } from './extension';
import { ExtensionService } from './extension.service';
import 'rxjs/add/operator/toPromise';
import { toInteger } from '@ng-bootstrap/ng-bootstrap/util/util';
import { AppService } from '../../app.service';
import { ExtensionCheckService } from '../../services/extension-check.service';


@Component({
  selector: 'ngx-add-extension-component',
  templateUrl: './extension-form-component.html',
  styleUrls: ['./extension-form-component.scss'],
})


export class AddExtensionComponent implements OnInit {

  constructor(private route: ActivatedRoute, private account_service: ExtensionService,
  private router: Router, private user_service: AUserService, private app_service: AppService,
  private extCheck: ExtensionCheckService) { }

  extension: Extension= new Extension;
  account_id: any= null;
  form: FormGroup;

  settings: Settings = new Settings;
  public sendbody: any = false;
  public sendcover: any = false;

  isError = false;
  errorText: any = [];
  user: User[] = [];
  selectedUser: User;
  didList: Extension[] = [];
  accountTypes = ['did', 'account'];
  availableExtensions: { extension_uuid: string; extension: string }[] = [];
  noExtensionsAvailable = false;

  ngOnInit(): void {
    this.extension.user_id = localStorage.getItem('aid');
    this.extension.type = 'account';
    this.account_service.get_DidList().then(data => { this.didList = data; });
    this.route.params.subscribe(params => {
      this.account_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        this.loadAvailableExtensions();
        return null;
      } else {
        return this.account_service.get_ExtensionData(this.account_id).then(data => {
          this.extension = data;
          this.loadAvailableExtensions(this.account_id);
        });
      }
    });
  }

  onTypeChange(type: string): void {
    if (type === 'account') {
      this.loadAvailableExtensions(this.account_id > 0 ? this.account_id : undefined);
    }
  }

  loadAvailableExtensions(excludeId?: number): void {
    this.extCheck.availableForFax(excludeId).then(list => {
      // if editing and current phone not in list, prepend it so it appears selected
      if (excludeId && this.extension.phone) {
        const phoneStr = String(this.extension.phone);
        const inList = list.some(e => e.extension === phoneStr);
        if (!inList) {
          list = [{ extension_uuid: '', extension: phoneStr }, ...list];
        }
      }
      this.availableExtensions = list;
      this.noExtensionsAvailable = list.length === 0;
    });
  }

  addExtension(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.account_service.add_Extension(this.extension).then(response => {
        this.extension.account_id = response;
        this.router.navigate(['../../extension'], {relativeTo: this.route});
        this.app_service.success_message = 'Account created successfully';
        this.clearMsg();
      }).catch(err => {
        this.isError = true;
        if (err.status === 409 && err._body) {
          try {
            const body = JSON.parse(err._body);
            this.errorText = [body.error.message];
          } catch {
            this.errorText = ['Validation error'];
          }
        } else {
          this.errorText = ['Account creation error'];
        }
      });
    } else {
      this.app_service.err_message = 'Error occurred while creating account';
      this.clearMsg();
    }
  }

  updateExtension(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.account_service.update_Extension(this.extension).then(response => {
        this.extension.account_id = this.account_id;
        this.router.navigate(['../../extension'], {relativeTo: this.route});
        this.app_service.success_message = 'Account updated successfully';
        this.clearMsg();
      })
      .catch(this.handleError);
    } else {
      this.app_service.err_message = 'Error occurred while updating account';
      this.clearMsg();
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  private checkFields(status = null):any{
    this.errorHandler(false, []);
    const t = this.extension.type;
    if (t === 'did') {
      if (!this.extension.phone) this.errorText.push('DID number is required.');
      if (!this.extension.email) this.errorText.push('Email is required.');
    } else {
      if (!this.extension.username) this.errorText.push('Username is required.');
      if (!this.extension.passwd) this.errorText.push('Password is required.');
      if (!this.extension.phone) this.errorText.push('PBX Extension is required.');
    }
  }

  private errorHandler(status, message):any{
    this.isError = status;
    this.errorText = message;
    if (status) {
      setTimeout(() => {
        this.isError = false;
        this.errorText = [];
      }, 10000);
    }
  }
  
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
