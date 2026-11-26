import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { AppService } from '../../../app/app.service';
import { NbAuthService } from '@nebular/auth';
import { PasswordPolicy } from './password_policy';
@Injectable()

export class PasswordPolicy_Service {

  constructor(private http: Http, private app_service: AppService, private authService: NbAuthService) { }


  passPolicy: PasswordPolicy = new PasswordPolicy;


  add_Policy(pass_policy: PasswordPolicy): Promise<PasswordPolicy> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(pass_policy);
    const addUrl = `${this.app_service.apiUrlPasswordPolicy}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as PasswordPolicy)
      .catch(response => this.app_service.handleError(response));
  }

  get_Policy() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    return this.http.get(this.app_service.apiUrlPasswordPolicy, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

}

