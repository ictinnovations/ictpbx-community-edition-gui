import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable()

export class DashboardService {

  constructor(private http: Http, private app_service: AppService) { }

  get_Statistics() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    return this.http.get(this.app_service.apiUrlDashboard, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  get_PbxStatistics() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrl}/pbx_statistics`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(() => ({}));
  }

  get_DashboardCards(user_id) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});    
    const url = `${this.app_service.apiUrlUsers}/${user_id}`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  set_DashboardCards(user_id, cards) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const body = JSON.stringify(cards);
    const url = `${this.app_service.apiUrlUsers}/${user_id}`;
    return this.http.put(url, body, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  get_didStat() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrlDashboard}?account_type=did`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  get_inFaxStat() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrlDashboard}?service_flag=2&direction=inbound&status=completed`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  get_outFaxStat() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrlDashboard}?service_flag=2&direction=outbound`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }
}
