import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { Device } from './device';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class DeviceService {

  constructor(private http: Http, private app_service: AppService) {}

  getList(tenantId: number = 0): Promise<Device[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = this.app_service.apiUrlDevices;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as Device[])
      .catch(e => this.app_service.handleError(e));
  }

  getData(device_uuid: string): Promise<Device> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.app_service.apiUrlDevices}/${device_uuid}`, options).toPromise()
      .then(r => r.json() as Device)
      .catch(e => this.app_service.handleError(e));
  }

  create(device: Device): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.app_service.apiUrlDevices, JSON.stringify(device), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update(device: Device): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.put(`${this.app_service.apiUrlDevices}/${device.device_uuid}`, JSON.stringify(device), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete(device_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlDevices}/${device_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
