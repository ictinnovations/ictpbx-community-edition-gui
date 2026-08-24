import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { environment } from '../environments/environment';
import { ActivatedRoute, Params } from '@angular/router';
import { Response, HttpModule, RequestOptions } from '@angular/http';
import { PasswordPolicy } from './pages/password_policy/password_policy';

@Injectable()

export class AppService {

  constructor(private http: Http, private router: Router, private _location: Location, private activatedRoute: ActivatedRoute) {
    // let copy_token = localStorage.getItem('copy_token');
    // if (copy_token != null) {
    //   this.upload_Header.push({name: 'Authorization', value: 'Bearer ' + localStorage.getItem('copy_token')});
    // }
    // else {
    //   let token:any = localStorage.getItem('auth_app_token');
    //   this.upload_Header.push({name: 'Authorization', value: 'Bearer ' + JSON.parse(token).value});
    // }
    if (localStorage.getItem('copy_token')) {
      this.upload_Header.push({ name: 'Authorization', value: 'Bearer ' + localStorage.getItem('copy_token') });
    }
    else if (localStorage.getItem('auth_app_token')) {
      let token: any = localStorage.getItem('auth_app_token');
      this.upload_Header.push({ name: 'Authorization', value: 'Bearer ' + JSON.parse(token).value });
    }
  }
  // headers for uploading the file
  upload_Header: Array<{
    name: string;
    value: string;
  }> = [];

  showMessages: any = {};
  public errors: string;
  public messages: string[] = [];
  public abc: any;
  public def: any;
  public err_code: string;
  public err_message: string;
  public INFO: string;
  public codes: any;
  public policy: any;

  public success_message: string;
  public info_message: string;
  public hasFaxProvider: boolean = true; // optimistic until checkFaxProvider() returns
  public faxProviderChecked: boolean = false;
  private token: string = localStorage.getItem('auth_app_token');
  private authToken: any = JSON.parse(this.token);
  apiUrl = environment.API_URL;
  protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  wsUrl = environment.WS_URL
    ? this.authToken?.value
      ? `${environment.WS_URL}?token=${this.authToken.value}`
      : environment.WS_URL
    : '';


  apiUrlContacts = `${this.apiUrl}/contacts`;
  apiUrlContactDNC = `${this.apiUrl}/contact_dncs`
  apiUrlDocument = `${this.apiUrl}/documents`;
  apiUrlText = `${this.apiUrl}/texts`;
  apiUrlBulk = `${this.apiUrl}/bulk/filter`;
  apiUrlRecording = `${this.apiUrl}/recordings`;
  apiUrlTemplate = `${this.apiUrl}/templates`;
  apiUrlTransmission = `${this.apiUrl}/transmissions`;
  apiUrlPrograms = `${this.apiUrl}/programs`;
  apiUrlRegion = `${this.apiUrl}/region`;
  apiUrlCountry = `${this.apiUrl}/country`;
  apiUrlServices = `${this.apiUrl}/services`;
  apiUrlProviders = `${this.apiUrl}/providers`;
  apiUrlDestination = `${this.apiUrl}/destination`;
  apiUrlUsers = `${this.apiUrl}/users`;
  apiUrlUser = `${this.apiUrl}/user`;
  apiUrlGroups = `${this.apiUrl}/groups`;
  apiUrlCampaigns = `${this.apiUrl}/campaigns`;
  apiUrlDashboard = `${this.apiUrl}/statistics`;
  apiUrlAccounts = `${this.apiUrl}/accounts`;
  apiUrlDid = `${this.apiUrl}/dids`;
  apiUrlCid = `${this.apiUrl}/cids`;
  apiUrlRoles = `${this.apiUrl}/roles`;
  apiUrlSpool = `${this.apiUrl}/spools`;
  apiUrlCdrList = `${this.apiUrl}/cdr`;
  apiUrlCDR = `${this.apiUrl}/cdr/csv`;
  apiUrlSpoolStat = `${this.apiUrl}/spoolsstat`;
  apiUrlStat = `${this.apiUrl}/stat/csv`;
  apiUrlRates = `${this.apiUrl}/rates`;
  apiUrlPlans = `${this.apiUrl}/plans`;
  apiUrlPayments = `${this.apiUrl}/payments`;
  apiUrlRoutes = `${this.apiUrl}/routes`;
  apiUrlexportact = `${this.apiUrl}/users/act/csv`;
  apiUrlTenants = `${this.apiUrl}/tenants`;
  apiUrlBranding = `${this.apiUrl}/branding`;
  apiUrlBrandingPublic = `${this.apiUrl}/branding_public`;
  apiUrlTimezone = `${this.apiUrl}/timezone`;
  apiUrlSSO = `${this.apiUrl}/authenticate`;
  apiUrlForgotPassword = `${this.apiUrl}/forgot_password`;
  apiUrlUpdatePassword = `${this.apiUrl}/update_password`;
  apiUrlTokenPayload = `${this.apiUrl}/token_payload`;
  apiUrlCover = `${this.apiUrl}/coverpage`;
  apiUrlCovers = `${this.apiUrl}/coverpages`;
  apiUrlAnnouncement = `${this.apiUrl}/announcement`;
  apiUrlPasswordPolicy = `${this.apiUrl}/password_policy`;
  apiUrlMessage = `${this.apiUrl}/messages`;
  apiUrlIvr = `${this.apiUrl}/programs`;
  apiUrlusers_cdr = `${this.apiUrl}/usersCDR`;
  apiUrlRingGroups     = `${this.apiUrl}/ring_groups`;
  apiUrlCallQueues     = `${this.apiUrl}/call_queues`;
  apiUrlVoicemails     = `${this.apiUrl}/voicemails`;
  apiUrlVoicemailGreetings = `${this.apiUrl}/voicemail_greetings`;
  apiUrlConferences    = `${this.apiUrl}/conferences`;
  apiUrlConferenceParticipants = `${this.apiUrl}/conference_participants`;
  apiUrlTimeConditions = `${this.apiUrl}/time_conditions`;
  apiUrlMusicOnHold    = `${this.apiUrl}/music_on_hold`;
  apiUrlRealtime       = `${this.apiUrl}/realtime`;
  apiUrlCallOriginate  = `${this.apiUrl}/call/originate`;
  apiUrlFpbxCdr        = `${this.apiUrl}/fpbx_cdr`;
  apiUrlCdrEtl         = `${this.apiUrl}/cdr_etl`;
  apiUrlDialplans      = `${this.apiUrl}/dialplans`;
  apiUrlCallFlows      = `${this.apiUrl}/call_flows`;
  apiUrlCallBlock      = `${this.apiUrl}/call_block`;
  apiUrlFollowMe       = `${this.apiUrl}/follow_me`;
  apiUrlGateways       = `${this.apiUrl}/gateways`;
  apiUrlInboundRoutes  = `${this.apiUrl}/inbound_routes`;
  apiUrlFpbxExtension  = `${this.apiUrl}/fpbx_extensions`;
  apiUrlFpbxExtensions = `${this.apiUrl}/fpbx_extensions`;
  apiUrlIvrMenus       = `${this.apiUrl}/ivr_menus`;
  apiUrlDevices        = `${this.apiUrl}/devices`;
  apiUrlDeviceProfiles = `${this.apiUrl}/device_profiles`;
  apiUrlDeviceVendors  = `${this.apiUrl}/device_vendors`;
  apiUrlDeviceLines    = `${this.apiUrl}/device_lines`;
  apiUrlDids           = `${this.apiUrl}/dids`;
  apiUrlBillingUsage   = `${this.apiUrl}/billing/usage`;
  apiUrlBillingQuota   = `${this.apiUrl}/billing/quota`;
  apiUrlBillingCredit  = `${this.apiUrl}/billing/credit`;
  apiUrlPackages       = `${this.apiUrl}/packages`;
  apiUrlSubscriptions  = `${this.apiUrl}/subscriptions`;
  apiUrlSms            = `${this.apiUrl}/sms`;
  apiUrlSmsThreads     = `${this.apiUrl}/sms/threads`;
  apiUrlSmsMessages    = `${this.apiUrl}/sms/messages`;
  apiUrlApiKeys        = `${this.apiUrl}/api_keys`;

  createAuthorizationHeader(headers: Headers) {
    let copy_token = localStorage.getItem('copy_token');
    if (copy_token != null) {
      headers.append('Authorization', ' Bearer ' + localStorage.getItem('copy_token'));
    }
    else {
      let token: any = localStorage.getItem('auth_app_token');
      headers.append('Authorization', ' Bearer ' + JSON.parse(token).value);
    }
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
  }

  get_Password_Policy(): any {
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.codes = params.code;
    });
    const url = `${this.apiUrlPasswordPolicy}`;
    return this.http
      .get(url)
      .toPromise()
      .then((response) => response.json() as PasswordPolicy)
      .catch((response) => this.handleError(response));
  }

  loginAuthorizationHeader(headers: Headers) {
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Accept', 'X-Auth-Token');
  }

  ForgotAuthorizationHeader(headers: Headers) {
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
  }

  ResetAuthorizationHeader(headers: Headers) {
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
  }

  /**
   * Queries the providers list and sets hasFaxProvider=true iff at least one
   * active SIP provider has service_flag bit 2 (fax). Force-refreshes when
   * `force` is true. Cached across pages otherwise.
   */
  loadTenants(): Promise<any[]> {
    const headers = new Headers();
    this.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.get(this.apiUrlTenants, options).toPromise()
      .then(r => r.json() as any[])
      .catch(() => []);
  }

  getCredit(): Promise<number | null> {
    const headers = new Headers();
    this.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.get(this.apiUrlBillingCredit, options).toPromise()
      .then(r => {
        const d = r.json();
        return d && d.credit != null ? parseFloat(d.credit) : null;
      }).catch(() => null);
  }

  public checkFaxProvider(force = false): Promise<boolean> {
    if (this.faxProviderChecked && !force) {
      return Promise.resolve(this.hasFaxProvider);
    }
    const headers = new Headers();
    this.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    // service_flag=2 → backend AND-mask filters to fax-capable providers
    return this.http.get(`${this.apiUrlProviders}?service_flag=2`, options).toPromise()
      .then(res => {
        const list = res.json() || [];
        const active = list.filter((p: any) => Number(p.active) === 1);
        this.hasFaxProvider = active.length > 0;
        this.faxProviderChecked = true;
        return this.hasFaxProvider;
      })
      .catch(() => {
        // On error, leave the flag optimistic so we don't false-block users.
        this.faxProviderChecked = true;
        return this.hasFaxProvider;
      });
  }

  public handleError(error: any): Promise<any> {
    // console.error('An error occurred', error); // for demo purposes only
    if (error.status === 0 || error.status === 500) {
      this.router.navigate(['pages/miscellaneous/404']);
    }
    if (error.status === 401) {
      // this.router.navigate(['auth/login']);
      this.router.navigate(['auth']);
    }
    if (error.status === 403) {
      this._location.back();
    }
    if (error.status === 404) {
      this.def = JSON.parse(error._body);
      this.err_code = this.def.error.code;
      // this.err_code = "403";
      this.err_message = this.def.error.message;
      this.abc = this.err_code + ', ' + this.err_message;
      this.errors = this.abc;
    }
    return Promise.reject(error.message || error);
  }

  public downloadError(error: any): Promise<any> {
    console.error('An error occurred', error);
    this.errors = error.status + ' ' + error.statusText;
    return Promise.reject(error.message || error);
  }

}
