import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { DeviceProfile } from './device-profile';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class DeviceProfileService {

  constructor(private http: Http, private app_service: AppService) {}

  getList(tenantId: number = 0): Promise<DeviceProfile[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = this.app_service.apiUrlDeviceProfiles;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as DeviceProfile[])
      .catch(e => this.app_service.handleError(e));
  }

  getData(device_profile_uuid: string): Promise<DeviceProfile> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.app_service.apiUrlDeviceProfiles}/${device_profile_uuid}`, options).toPromise()
      .then(r => r.json() as DeviceProfile)
      .catch(e => this.app_service.handleError(e));
  }

  create(profile: DeviceProfile): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.app_service.apiUrlDeviceProfiles, JSON.stringify(profile), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update(profile: DeviceProfile): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.put(`${this.app_service.apiUrlDeviceProfiles}/${profile.device_profile_uuid}`, JSON.stringify(profile), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete(device_profile_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlDeviceProfiles}/${device_profile_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
