import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, Response, HttpModule, RequestOptions } from '@angular/http';
import { Branding } from './branding';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';
import { exit } from 'process';

@Injectable()

export class BrandingService {

  // aBranding: Branding[] = [];
  branding_id: any= null;
  branding: Branding = new Branding;

  constructor(private http: Http, private app_service: AppService) {}

  add_Branding(tenant_id, branding: Branding): Promise<Branding> {
    branding["tenant_id"] = tenant_id;
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(branding);
    const url = `${this.app_service.apiUrlBranding}`;
    return this.http.post(url, body, options).toPromise().then(response => response.json() as Branding)
    .catch(response => this.app_service.handleError(response));
  }

  get_Branding(tenant_id = null): Promise<Branding> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrlBranding}/${tenant_id}`;
    return this.http.get(url, options).toPromise().then(response => response.json() as Branding);
    // .catch(response => this.app_service.handleError(response));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
