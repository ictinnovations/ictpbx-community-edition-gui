import { Component, OnInit } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { AppService } from '../../app.service';
import { MyAccount } from './my-account';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

@Component({
  selector: 'ngx-my-account',
  templateUrl: './my-account.component.html',
})
export class MyAccountComponent implements OnInit {
  accounts: MyAccount[] = [];
  loading = true;
  notFound = false;

  extensions: DestOption[] = [];
  saveSuccess: { [accountId: number]: boolean } = {};
  saveError:   { [accountId: number]: string  } = {};
  saving:      { [accountId: number]: boolean } = {};

  emailSaving = false;
  emailSaveSuccess = false;
  emailSaveError = '';

  showPbxPassword: { [accountId: number]: boolean } = {};

  constructor(
    private http: Http,
    private appService: AppService,
    private pbxDest: PbxDestinationService,
  ) {}

  ngOnInit() {
    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });

    this.http.get(`${this.appService.apiUrlAccounts}/my`, options).toPromise()
      .then(res => {
        const data = res.json();
        if (!Array.isArray(data) || data.length === 0) {
          this.notFound = true;
        } else {
          this.accounts = data.map((d: any) => Object.assign(new MyAccount(), d));
          const hasPbx = this.accounts.some(a => a.pbx_extension_uuid);
          if (hasPbx) this.pbxDest.getExtensions().then(exts => { this.extensions = exts; });
        }
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.notFound = true;
      });
  }

  get primaryAccount(): MyAccount {
    return this.accounts[0] || new MyAccount();
  }

  saveExtensionSettings(acc: MyAccount) {
    if (!acc.pbx_extension_uuid) return;
    this.saving[acc.account_id] = true;
    this.saveSuccess[acc.account_id] = false;
    this.saveError[acc.account_id] = '';

    const payload = {
      extension_uuid:                       acc.pbx_extension_uuid,
      effective_caller_id_name:             acc.pbx_caller_id_name,
      do_not_disturb:                       acc.pbx_do_not_disturb,
      forward_all_enabled:                  acc.pbx_forward_all_enabled,
      forward_all_destination:              acc.pbx_forward_all_destination || null,
      forward_busy_enabled:                 acc.pbx_forward_busy_enabled,
      forward_busy_destination:             acc.pbx_forward_busy_destination || null,
      forward_no_answer_enabled:            acc.pbx_forward_no_answer_enabled,
      forward_no_answer_destination:        acc.pbx_forward_no_answer_destination || null,
    };

    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });

    this.http.put(
      `${this.appService.apiUrlFpbxExtensions}/${acc.pbx_extension_uuid}`,
      JSON.stringify(payload),
      options,
    ).toPromise()
      .then(() => { this.saveSuccess[acc.account_id] = true; })
      .catch(() => { this.saveError[acc.account_id] = 'Save failed. Please try again.'; })
      .finally(() => { this.saving[acc.account_id] = false; });
  }

  saveFaxEmail() {
    this.emailSaving = true;
    this.emailSaveSuccess = false;
    this.emailSaveError = '';

    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });

    this.http.put(
      `${this.appService.apiUrlAccounts}/${this.primaryAccount.account_id}`,
      JSON.stringify({ email: this.primaryAccount.email }),
      options,
    ).toPromise()
      .then(() => { this.emailSaveSuccess = true; })
      .catch(() => { this.emailSaveError = 'Save failed. Please try again.'; })
      .finally(() => { this.emailSaving = false; });
  }
}
