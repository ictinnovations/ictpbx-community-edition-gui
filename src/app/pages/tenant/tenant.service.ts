import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, Response, HttpModule, RequestOptions } from '@angular/http';
import { Tenant } from './tenant';
import { AppService } from '../../../app/app.service';
import { environment } from '../../../environments/environment';

import 'rxjs/add/operator/toPromise';

@Injectable()

export class TenantService {

  aTenant: Tenant[]= [];
  tenant_id: any= null;
  tenant: Tenant= new Tenant;

  constructor(private http: Http, private app_service: AppService) {}

  get_TenantList(filter = null): Promise<Tenant[]> {
    if (environment.COMMUNITY_EDITION) return Promise.resolve([] as Tenant[]);
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    var url = this.app_service.apiUrlTenants;
    if(filter){
      url = `${url}?${filter}`;
    }
    return this.http.get(url, options).toPromise()
    .then(response => response.json() as Tenant[]).catch(response => this.app_service.handleError(response));
  }

  get_query_TenantList(query): Promise<Tenant[]> {
    if (environment.COMMUNITY_EDITION) return Promise.resolve([] as Tenant[]);
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrlTenants}${query}`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json() as Tenant[]).catch(response => this.app_service.handleError(response));
  }

  get_TenantData(tenant_id): Promise<Tenant> {
    if (environment.COMMUNITY_EDITION) return Promise.resolve(new Tenant());
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url5 = `${this.app_service.apiUrlTenants}/${tenant_id}`;
    return this.http.get(url5, options).toPromise()
    .then(response => response.json() as Tenant).catch(response => this.app_service.handleError(response));
  }

  add_Tenant(tenant: Tenant): Promise<Tenant> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(tenant);
    const addUrl = `${this.app_service.apiUrlTenants}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Tenant)
    .catch(response => this.app_service.handleError(response));
  }

  update_Tenant(tenant: Tenant): Promise<Tenant > {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(tenant);
    const updateUrl = `${this.app_service.apiUrlTenants}/${tenant.tenant_id}`;
    return this.http.put(updateUrl, body, options).toPromise().then(response => response.json() as Tenant)
    .catch(response => this.app_service.handleError(response));
  }

  delete_Tenant(tenant_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deleteUrl = `${this.app_service.apiUrlTenants}/${tenant_id}`;
    return this.http.delete(deleteUrl, options).toPromise().then(response => response.json() as Tenant)
   .catch(response => this.app_service.handleError(response));
  }
  get_TenantCard(tenant = 0) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers}); 
    const url = (tenant == 0) ? `${this.app_service.apiUrlDashboard}` : `${this.app_service.apiUrlDashboard}?tenant_id=${tenant}`;  
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }
  public get_Timezone() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    return this.http.get(this.app_service.apiUrlTimezone, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));    
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}

