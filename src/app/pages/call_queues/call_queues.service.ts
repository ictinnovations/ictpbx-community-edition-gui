import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { CallQueue } from './call_queues';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class CallQueueService {

  constructor(private http: Http, private app_service: AppService) {}

  get_CallQueueList(tenantId: number = 0): Promise<CallQueue[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = this.app_service.apiUrlCallQueues;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as CallQueue[])
      .catch(e => this.app_service.handleError(e));
  }

  get_CallQueueData(call_center_queue_uuid: string): Promise<CallQueue> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.app_service.apiUrlCallQueues}/${call_center_queue_uuid}`, options).toPromise()
      .then(r => r.json() as CallQueue)
      .catch(e => this.app_service.handleError(e));
  }

  add_CallQueue(q: CallQueue): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.app_service.apiUrlCallQueues, JSON.stringify(q), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update_CallQueue(q: CallQueue): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.put(`${this.app_service.apiUrlCallQueues}/${q.call_center_queue_uuid}`, JSON.stringify(q), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete_CallQueue(call_center_queue_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlCallQueues}/${call_center_queue_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }
}
