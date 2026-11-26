import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { Gateway } from './gateway';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class GatewayService {
  constructor(private http: Http, private app_service: AppService) {}

  getList(): Promise<Gateway[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.get(this.app_service.apiUrlGateways, options).toPromise()
      .then(r => r.json() as Gateway[])
      .catch(e => this.app_service.handleError(e));
  }

  getData(gateway_uuid: string): Promise<Gateway> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.get(`${this.app_service.apiUrlGateways}/${gateway_uuid}`, options).toPromise()
      .then(r => r.json() as Gateway)
      .catch(e => this.app_service.handleError(e));
  }

  create(gw: Gateway): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.post(this.app_service.apiUrlGateways, JSON.stringify(gw), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update(gw: Gateway): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.put(`${this.app_service.apiUrlGateways}/${gw.gateway_uuid}`, JSON.stringify(gw), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete(gateway_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.delete(`${this.app_service.apiUrlGateways}/${gateway_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
