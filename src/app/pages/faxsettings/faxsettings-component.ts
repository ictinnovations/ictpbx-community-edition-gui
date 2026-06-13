import { Component, OnInit, AfterViewInit, DoCheck } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../user/user';
import { FormsModule, FormGroup, FormBuilder, FormControl, NG_VALIDATORS, Validator, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ExtensionService } from '../extension/extension.service';
import { Extension } from '../extension/extension';
import { AppService } from '../../app.service';
import { AUserService } from '../user/user.service';
import { TransmissionService } from '../transmission/transmission.service';
import { SendFaxService } from '../sendfax/sendfax.service';
import { TenantService } from '../tenant/tenant.service';


@Component({
  selector: 'ngx-handler',
  template: `   <nb-card>
  <nb-card-header>
    {{'fax_settings.title' | translate}}
  </nb-card-header>
  <nb-card-body>
      <nb-alert status="warning" *ngIf="app_service.faxProviderChecked && !app_service.hasFaxProvider">
        No fax-enabled trunk found. Add a Provider with "Supports Fax (T.38 / G.711 pass-through)" enabled under Routings &rarr; Trunks for these settings to take effect.
      </nb-alert>
      <div class="col-sm-6">
        <div class="form-group">
          <input type="checkbox" [(ngModel)]="sendcover" [ngModelOptions]="{standalone: true}" [checked]="sendcover"> {{'fax_settings.cover' | translate}}<br>
        </div>
      </div>
      <div class="col-sm-6">
        <div class="form-group">
          <input type="checkbox" [(ngModel)]="sendbody" [ngModelOptions]="{standalone: true}" [checked]="sendbody"> {{'fax_settings.body' | translate}}<br>
        </div>
      </div>
      <br>
      <button type="button" class="btn btn-success" (click)="updateExtSettings()">{{'buttons.submit' | translate}}</button>
  </nb-card-body>
</nb-card>


 <nb-card *ngIf="retry_interval">
  <nb-card-header>
  Retry Fax Interval 
  </nb-card-header>
  <nb-card-body>
      <div class="col-sm-6">
        <div class="form-group row">
           <div class="m-2">
           </div>
          <input type="number" [(ngModel)] = "retry_minutes" class="form-control" id="minutes"  placeholder="M" min="0" max="59" style="width: 80px;">
            <div class="m-2">
            :
           </div>
          <input type="number" [(ngModel)] = "retry_seconds" class="form-control" id="seconds"  placeholder="S" min="0" max="59" style="width: 80px;">
        </div>
      </div>
      <br>
      <button type="button" class="btn btn-success" (click) = "update_retry_intervals()">{{'buttons.submit' | translate}}</button>
  </nb-card-body>
</nb-card>

`,
  styleUrls: ['./faxsettings-component.scss'],
})
export class FaxSettingsComponent implements OnInit {

  constructor(private account_service: ExtensionService, private tenant_service: TenantService, private user_service: AUserService, private sendfax_service: SendFaxService, public app_service: AppService) {
  }

  sendbody: any = false;
  sendcover: any = false;
  retry_interval: any = false;
  retry_minutes: any = null;
  retry_seconds: any = null;
  extension: Extension = new Extension;
  tenantObj: any = {};
  retention_period_in: any = 0;

  showRetentionSetting: any = 0;
  user: User = new User;
  user_id = localStorage.getItem("aid");

  ngOnInit() {
    this.app_service.checkFaxProvider();
    if (localStorage.getItem('is_admin') == '1') {
      this.retry_interval = true;
      this.get_intervals();
    }
    if (localStorage.getItem('retention_permission') == '1') {
      this.showRetentionSetting = 1;
    }
    this.account_service.get_ExtensionData(-1).then(data => {

      this.extension = data;
      this.fetch_settings();
      this.fetch_coverpagesettings();

    }).catch(err => this.handleError(err));

  }

  fetch_settings() {
    this.account_service.get_Settings(this.extension.account_id).then(response => {
      this.sendbody = response;
    })
      .catch(err => this.handleError(err));
  }


  updateTenant(tenantObj) {
    this.tenant_service.update_Tenant(this.tenantObj).then(response => {
      this.app_service.success_message = "Retention period updated successfully!";
      this.clearMsg();
    })
  }

  updateRetSettings() {
    if (this.retention_period_in > 0 && this.retention_period_in >= this.tenantObj.min_retention) {
      this.tenantObj.retention_period = this.retention_period_in;
      this.updateTenant(this.tenantObj);
    }
    else {
      this.app_service.errors = "Retention period must be within following range: " + this.tenantObj.min_retention + " - " + this.tenantObj.max_retention;
      this.clearMsg();
    }
  }

  update_retry_intervals() {
    var retry_interval = this.retry_minutes * 60 + this.retry_seconds;
    this.sendfax_service.set_retry_interval(retry_interval);
    this.app_service.success_message = 'Fax Settings Updated Successfully';
    this.clearMsg();
  }
  get_intervals() {
    this.sendfax_service.get_retry_interval().then(data => {
      var minutes = Math.floor(data / 60);
      this.retry_minutes = minutes;
      var seconds = data % 60;
      this.retry_seconds = seconds;
    });
  }

  fetch_coverpagesettings() {
    this.user_service.get_UserData(localStorage.getItem("aid")).then(data => {
      this.user = data;
      if (this.user.cover == 1) {
        this.sendcover = true;
      }
      else {
        this.sendcover = false;
      }
    })
      .catch(err => this.handleError(err));
  }

  updateExtSettings() {
    if (this.sendbody == true) {
      this.updateSettings(this.extension.account_id);
    }
    else {
      this.deleteSettings(this.extension.account_id);
    }
    if (this.sendcover == true) {
      this.user.cover = 1;
      this.update_coverpagesettings(this.user);
    }
    else {
      this.user.cover = 0;
      this.update_coverpagesettings(this.user);
    }

  }

  updateSettings(account_id) {
    this.extension.settings.emailtofax_coversheet = 'body';
    this.account_service.update_Settings(account_id, this.extension.settings.emailtofax_coversheet).then(data => {
      this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    })
      .catch(this.handleError);
  }

  deleteSettings(account_id) {
    this.account_service.delete_Settings(account_id).then(data => {
      this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    })
      .catch(this.handleError);
  }

  update_coverpagesettings(user) {
    this.user_service.update_User(user).then(data => {
      this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    }).catch(this.handleError);
  }

  delete_coverpagesettings(account_id) {
    this.account_service.delete_coverpageSettings(account_id).then(data => {
      this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    })
      .catch(this.handleError);
  }
  clearMsg() {
    setTimeout(() => {
      this.app_service.success_message = '';
      this.app_service.errors = '';
    }, 2000);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

}
