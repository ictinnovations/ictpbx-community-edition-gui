import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, Response, HttpModule, RequestOptions } from '@angular/http';
import { Mfa } from './mfa';
import { AppService } from '../../app.service';
import { AUserService } from '../../pages/user/user.service';
import { HttpClientModule, HttpClient, HttpParams } from '@angular/common/http';

import 'rxjs/add/operator/toPromise';

export interface VerificationCodeResult {
  code: string;
  expiryTime: number;
}

@Injectable({
  providedIn: 'root'
})

export class MfaService {
  aUser: Mfa[]= [];
  mfa: Mfa= new Mfa;
  user: any;
  rEmail: any;

  constructor(
    private http: Http, 
    private app_service: AppService,
    private router: Router,
    private user_service: AUserService,
    private httpclient: HttpClient
  ) {}

  get_UserList(tenant = 0): Promise<Mfa[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers}); 
    const url = (tenant == 0) ? `${this.app_service.apiUrlUsers}` : `${this.app_service.apiUrlUsers}?tenant_id=${tenant}`;  
    return this.http.get(url, options).toPromise()
    .then(response => response.json() as Mfa[]).catch(response => this.app_service.handleError(response));
  }

  TemplateCreate(template): Promise<Mfa> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(template);
    const addUrl = `${this.app_service.apiUrlMessage}/templates`;
    return this.http.post(addUrl, body, options).toPromise()
    .then(response => response.json() as Mfa)
    .catch(response => this.app_service.handleError(response));
  }

  send_email_program(email): Promise<Mfa> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(email);
    const sendProUrl = `${this.app_service.apiUrlPrograms}/sendemail`;
    return this.http.post(sendProUrl, body, options).toPromise().then(response => response.json() as Mfa)
    .catch(err => this.app_service.handleError(err));
  }

  transmission(email, program_id): Promise<Mfa> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(email);
    const sendProUrl = `${this.app_service.apiUrlPrograms}/${program_id}/transmissions`;
    return this.http.post(sendProUrl, body, options).toPromise().then(response => response.json() as Mfa)
    .catch(err => this.app_service.handleError(err));
  }

  sendTransmission(transmission_id): Promise<Mfa> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(transmission_id);  // body not required
    const sendProUrl = `${this.app_service.apiUrlTransmission}/${transmission_id}/send`;
    return this.http.post(sendProUrl, body, options).toPromise().then(response => response.json() as Mfa)
    .catch(err => this.app_service.handleError(err));
  }

  getUserlist(userId: number): Promise<any> {
    return this.user_service.get_UserData(userId).then(data => {
      this.user = data;
      return data;
    });
  }

  search_account_Data(userId: number) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getApi = `${this.app_service.apiUrlAccounts}?created_by=${userId}&type=account`;
    return this.http.get(getApi, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  searchContact(user) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getApi = `${this.app_service.apiUrlContacts}?created_by=${user.user_id}&email=${user.email}`;
    return this.http.get(getApi, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  createContact(contact): Promise<Mfa> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(contact);
    const addUrl = `${this.app_service.apiUrlContacts}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Mfa)
    .catch(response => this.app_service.handleError(response));
  }

  delete_template(template_id): Promise<Mfa> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deleteUrl = `${this.app_service.apiUrlMessage}/templates/${template_id}`;
    return this.http.delete(deleteUrl, options).toPromise().then(response => response.json() as Mfa)
    .catch(response => this.app_service.handleError(response));
  }

  TOTPqrCode(username) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(username);
    const addUrl = `${this.app_service.apiUrlUser}/totpqrcode`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Mfa)
    .catch(response => this.app_service.handleError(response));
  }

  TOTPVerify(data): Promise<Mfa> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(data);
    const addUrl = `${this.app_service.apiUrlUser}/totp/verify`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Mfa)
    .catch(response => this.app_service.handleError(response));
  }

  searchProvider(provider) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getApi = `${this.app_service.apiUrlProviders}?service_flag=${provider.service_flag}&type=${provider.type}`;
    return this.http.get(getApi, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  sendSms(apiKey: string, to: string, content: string, host: string) {
    const httpmessageURL = host;
    const url = `${httpmessageURL}?apiKey=${encodeURIComponent(apiKey)}&to=${encodeURIComponent(to)}&content=${encodeURIComponent(content)}`;

    return this.http.get(url)
      .toPromise()  // Convert Observable to Promise
      .then(response => response)
      .catch(error => {
        console.error('Error in sending message', error);
        let errorMessage = 'Unknown error';
        if (error && error._body) {
          try {
            // Parse the _body property to get the error details
            const errorObj = JSON.parse(error._body);
            const errorCode = errorObj.errorCode;
            const errorDescription = errorObj.errorDescription;
            console.error(`Error in sending message: ${errorCode} - ${errorDescription}`);
            errorMessage = `Error in sending message: ${errorCode} - ${errorDescription}`;
          } catch (parseError) {
            console.error('Error parsing error response', parseError);
            errorMessage  = 'Error parsing error response';
          }
        } else {
          console.error('Unknown error', error);
        }
        return Promise.reject(errorMessage);
      });
  }

  navigateToMFA() {
    this.router.navigate(['auth/mfa']);
  }

  generateNumericVerificationCode(length: number = 6): VerificationCodeResult {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    let expiryTime = Date.now() + 5 * 60 * 1000; // Set expiry time to 5 minutes from now
    return { code, expiryTime };
  }

} 
