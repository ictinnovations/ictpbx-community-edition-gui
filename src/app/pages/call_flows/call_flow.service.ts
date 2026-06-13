import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { CallFlow } from './call_flow';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class CallFlowService {
  constructor(private http: Http, private app: AppService) {}

  private opts(): RequestOptions {
    const h = new Headers(); this.app.createAuthorizationHeader(h);
    return new RequestOptions({ headers: h });
  }

  getList(tenantId: number = 0): Promise<CallFlow[]> {
    const url = tenantId > 0 ? `${this.app.apiUrlCallFlows}?tenant_id=${tenantId}` : this.app.apiUrlCallFlows;
    return this.http.get(url, this.opts()).toPromise()
      .then(r => r.json() as CallFlow[]).catch(e => this.app.handleError(e));
  }

  getData(uuid: string): Promise<CallFlow> {
    return this.http.get(`${this.app.apiUrlCallFlows}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json() as CallFlow).catch(e => this.app.handleError(e));
  }

  add(o: CallFlow): Promise<any> {
    return this.http.post(this.app.apiUrlCallFlows, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  update(o: CallFlow): Promise<any> {
    return this.http.put(`${this.app.apiUrlCallFlows}/${o.call_flow_uuid}`, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  delete(uuid: string): Promise<any> {
    return this.http.delete(`${this.app.apiUrlCallFlows}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }
}
