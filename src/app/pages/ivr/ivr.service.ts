import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { Ivr } from './ivr';
import { AppService } from '../../../app/app.service';

@Injectable()
export class IvrService {

  constructor(private http: Http, private app_service: AppService) { }

  get_IvrList(): Promise<Ivr[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(this.app_service.apiUrlIvr, options).toPromise()
      .then(response => response.json() as Ivr[])
      .catch(response => this.app_service.handleError(response));
  }

  get_IvrData(program_id): Promise<Ivr> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlIvr}/${program_id}`;
    return this.http.get(url, options).toPromise()
      .then(response => response.json() as Ivr)
      .catch(response => this.app_service.handleError(response));
  }

  add_Ivr(ivr: Ivr): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(ivr);
    return this.http.post(this.app_service.apiUrlIvr, body, options).toPromise()
      .then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }

  update_Ivr(ivr: Ivr): Promise<Ivr> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(ivr);
    const url = `${this.app_service.apiUrlIvr}/${ivr.program_id}`;
    return this.http.put(url, body, options).toPromise()
      .then(response => response.json() as Ivr)
      .catch(response => this.app_service.handleError(response));
  }

  delete_Ivr(program_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlIvr}/${program_id}`;
    return this.http.delete(url, options).toPromise()
      .then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }
}
