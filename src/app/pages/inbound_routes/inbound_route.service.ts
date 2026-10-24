import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { InboundRoute } from './inbound_route';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class InboundRouteService {
  constructor(private http: Http, private app_service: AppService) {}

  getList(tenantId: number = 0): Promise<InboundRoute[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    const url = tenantId > 0 ? `${this.app_service.apiUrlInboundRoutes}?tenant_id=${tenantId}` : this.app_service.apiUrlInboundRoutes;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as InboundRoute[])
      .catch(e => this.app_service.handleError(e));
  }

  getData(destination_uuid: string): Promise<InboundRoute> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.get(`${this.app_service.apiUrlInboundRoutes}/${destination_uuid}`, options).toPromise()
      .then(r => r.json() as InboundRoute)
      .catch(e => this.app_service.handleError(e));
  }

  create(route: InboundRoute): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.post(this.app_service.apiUrlInboundRoutes, JSON.stringify(route), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update(route: InboundRoute): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.put(`${this.app_service.apiUrlInboundRoutes}/${route.destination_uuid}`, JSON.stringify(route), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete(destination_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http.delete(`${this.app_service.apiUrlInboundRoutes}/${destination_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
