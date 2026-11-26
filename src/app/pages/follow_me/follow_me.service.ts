import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { FollowMe } from './follow_me';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class FollowMeService {
  constructor(private http: Http, private app: AppService) {}

  private opts(): RequestOptions {
    const h = new Headers(); this.app.createAuthorizationHeader(h);
    return new RequestOptions({ headers: h });
  }

  getList(tenantId: number = 0): Promise<FollowMe[]> {
    const url = tenantId > 0 ? `${this.app.apiUrlFollowMe}?tenant_id=${tenantId}` : this.app.apiUrlFollowMe;
    return this.http.get(url, this.opts()).toPromise()
      .then(r => r.json() as FollowMe[]).catch(e => this.app.handleError(e));
  }

  getData(uuid: string): Promise<FollowMe> {
    return this.http.get(`${this.app.apiUrlFollowMe}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json() as FollowMe).catch(e => this.app.handleError(e));
  }

  add(o: FollowMe): Promise<any> {
    return this.http.post(this.app.apiUrlFollowMe, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  update(o: FollowMe): Promise<any> {
    return this.http.put(`${this.app.apiUrlFollowMe}/${o.follow_me_uuid}`, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  delete(uuid: string): Promise<any> {
    return this.http.delete(`${this.app.apiUrlFollowMe}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }
}
