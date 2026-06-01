import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { MusicOnHold } from './music_on_hold';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class MusicOnHoldService {

  constructor(private http: Http, private app_service: AppService) {}

  getList(tenantId: number = 0): Promise<MusicOnHold[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = this.app_service.apiUrlMusicOnHold;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as MusicOnHold[])
      .catch(e => this.app_service.handleError(e));
  }

  getData(uuid: string): Promise<MusicOnHold> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.app_service.apiUrlMusicOnHold}/${uuid}`, options).toPromise()
      .then(r => r.json() as MusicOnHold)
      .catch(e => this.app_service.handleError(e));
  }

  add(m: MusicOnHold): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.app_service.apiUrlMusicOnHold, JSON.stringify(m), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update(m: MusicOnHold): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.put(`${this.app_service.apiUrlMusicOnHold}/${m.music_on_hold_uuid}`, JSON.stringify(m), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete(uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlMusicOnHold}/${uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
