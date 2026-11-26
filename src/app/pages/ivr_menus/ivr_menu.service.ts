import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { IvrMenu } from './ivr_menu';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class IvrMenuService {
  constructor(private http: Http, private app_service: AppService) {}

  getList(tenantId: number = 0): Promise<IvrMenu[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    let url = this.app_service.apiUrlIvrMenus;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as IvrMenu[])
      .catch(e => this.app_service.handleError(e));
  }

  getData(ivr_menu_uuid: string): Promise<IvrMenu> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.get(`${this.app_service.apiUrlIvrMenus}/${ivr_menu_uuid}`, options).toPromise()
      .then(r => r.json() as IvrMenu)
      .catch(e => this.app_service.handleError(e));
  }

  create(menu: IvrMenu): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.post(this.app_service.apiUrlIvrMenus, JSON.stringify(menu), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update(menu: IvrMenu): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.put(`${this.app_service.apiUrlIvrMenus}/${menu.ivr_menu_uuid}`, JSON.stringify(menu), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete(ivr_menu_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.delete(`${this.app_service.apiUrlIvrMenus}/${ivr_menu_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
