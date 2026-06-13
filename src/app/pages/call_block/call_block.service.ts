import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { CallBlock } from './call_block';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class CallBlockService {
  constructor(private http: Http, private app: AppService) {}

  private opts(): RequestOptions {
    const h = new Headers(); this.app.createAuthorizationHeader(h);
    return new RequestOptions({ headers: h });
  }

  getList(tenantId: number = 0): Promise<CallBlock[]> {
    const url = tenantId > 0 ? `${this.app.apiUrlCallBlock}?tenant_id=${tenantId}` : this.app.apiUrlCallBlock;
    return this.http.get(url, this.opts()).toPromise()
      .then(r => r.json() as CallBlock[]).catch(e => this.app.handleError(e));
  }

  getData(uuid: string): Promise<CallBlock> {
    return this.http.get(`${this.app.apiUrlCallBlock}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json() as CallBlock).catch(e => this.app.handleError(e));
  }

  add(o: CallBlock): Promise<any> {
    return this.http.post(this.app.apiUrlCallBlock, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  update(o: CallBlock): Promise<any> {
    return this.http.put(`${this.app.apiUrlCallBlock}/${o.call_block_uuid}`, JSON.stringify(o), this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }

  delete(uuid: string): Promise<any> {
    return this.http.delete(`${this.app.apiUrlCallBlock}/${uuid}`, this.opts()).toPromise()
      .then(r => r.json()).catch(e => this.app.handleError(e));
  }
}
