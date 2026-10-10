import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { FpbxExtension } from './fpbx_extension';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class FpbxExtensionService {

  constructor(private http: Http, private app_service: AppService) {}

  getList(tenantId: number = 0): Promise<FpbxExtension[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = this.app_service.apiUrlFpbxExtensions;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as FpbxExtension[])
      .catch(e => this.app_service.handleError(e));
  }

  getData(extension_uuid: string): Promise<FpbxExtension> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.app_service.apiUrlFpbxExtensions}/${extension_uuid}`, options).toPromise()
      .then(r => r.json() as FpbxExtension)
      .catch(e => this.app_service.handleError(e));
  }

  create(ext: FpbxExtension): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.app_service.apiUrlFpbxExtensions, JSON.stringify(ext), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update(ext: FpbxExtension): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.put(`${this.app_service.apiUrlFpbxExtensions}/${ext.extension_uuid}`, JSON.stringify(ext), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  getUsers(): Promise<any[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(this.app_service.apiUrlUsers, options).toPromise()
      .then(r => r.json() as any[])
      .catch(e => this.app_service.handleError(e));
  }

  delete(extension_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlFpbxExtensions}/${extension_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

}
