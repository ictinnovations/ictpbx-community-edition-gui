import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { TimeCondition } from './time_condition';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class TimeConditionService {
  constructor(private http: Http, private app: AppService) {}

  private opts(): RequestOptions {
    const h = new Headers(); this.app.createAuthorizationHeader(h);
    return new RequestOptions({ headers: h });
  }

  getList(tenantId: number = 0): Promise<TimeCondition[]> {
    const url = tenantId > 0 ? `${this.app.apiUrlTimeConditions}?tenant_id=${tenantId}` : this.app.apiUrlTimeConditions;
    return this.http.get(url, this.opts()).toPromise()
      .then(r => r.json() as TimeCondition[]).catch(e => this.app.handleError(e));
  }

  getData(uuid: string): Promise<TimeCondition> {
    return this.http.get(`${this.app.apiUrlTimeConditions}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json() as TimeCondition).catch(e => this.app.handleError(e));
  }

  add(o: TimeCondition): Promise<any> {
    return this.http.post(this.app.apiUrlTimeConditions, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  update(o: TimeCondition): Promise<any> {
    return this.http.put(`${this.app.apiUrlTimeConditions}/${o.dialplan_uuid}`, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  delete(uuid: string): Promise<any> {
    return this.http.delete(`${this.app.apiUrlTimeConditions}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }
}
