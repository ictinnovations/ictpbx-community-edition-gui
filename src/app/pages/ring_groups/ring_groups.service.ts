import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { RingGroup } from './ring_groups';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class RingGroupService {

  constructor(private http: Http, private app_service: AppService) {}

  get_RingGroupList(tenantId: number = 0): Promise<RingGroup[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = this.app_service.apiUrlRingGroups;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as RingGroup[])
      .catch(e => this.app_service.handleError(e));
  }

  get_RingGroupData(ring_group_uuid: string): Promise<RingGroup> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.app_service.apiUrlRingGroups}/${ring_group_uuid}`, options).toPromise()
      .then(r => r.json() as RingGroup)
      .catch(e => this.app_service.handleError(e));
  }

  add_RingGroup(rg: RingGroup): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.app_service.apiUrlRingGroups, JSON.stringify(rg), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update_RingGroup(rg: RingGroup): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.put(`${this.app_service.apiUrlRingGroups}/${rg.ring_group_uuid}`, JSON.stringify(rg), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete_RingGroup(ring_group_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlRingGroups}/${ring_group_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
