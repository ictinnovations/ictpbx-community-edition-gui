import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { AppService } from '../../app.service';
import { Did, FaxAccount } from './dids';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class DidsService {

  constructor(private http: Http, private appService: AppService) {}

  private headers(): RequestOptions {
    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    return new RequestOptions({ headers });
  }

  list(): Promise<Did[]> {
    return this.http.get(this.appService.apiUrlDids, this.headers())
      .toPromise().then(r => r.json() as Did[])
      .catch(err => this.appService.handleError(err));
  }

  get(id: number): Promise<Did> {
    return this.http.get(`${this.appService.apiUrlDids}/${id}`, this.headers())
      .toPromise().then(r => r.json() as Did)
      .catch(err => this.appService.handleError(err));
  }

  create(did: Did): Promise<Did> {
    return this.http.post(this.appService.apiUrlDids, JSON.stringify(did), this.headers())
      .toPromise().then(r => r.json() as Did)
      .catch(err => this.appService.handleError(err));
  }

  update(did: Did): Promise<Did> {
    return this.http.put(`${this.appService.apiUrlDids}/${did.id}`, JSON.stringify(did), this.headers())
      .toPromise().then(r => r.json() as Did)
      .catch(err => this.appService.handleError(err));
  }

  assign(id: number, fax_account_id: number): Promise<any> {
    return this.http.put(
      `${this.appService.apiUrlDids}/${id}/assign`,
      JSON.stringify({ fax_account_id }),
      this.headers(),
    ).toPromise().then(r => r.json())
      .catch(err => this.appService.handleError(err));
  }

  delete(id: number): Promise<any> {
    return this.http.delete(`${this.appService.apiUrlDids}/${id}`, this.headers())
      .toPromise().then(r => r.json())
      .catch(err => this.appService.handleError(err));
  }

  listFaxAccounts(): Promise<FaxAccount[]> {
    return this.http.get(`${this.appService.apiUrlAccounts}?type=account`, this.headers())
      .toPromise().then(r => r.json() as FaxAccount[])
      .catch(err => this.appService.handleError(err));
  }

  listTenants(): Promise<any[]> {
    return this.http.get(this.appService.apiUrlTenants, this.headers())
      .toPromise().then(r => r.json() as any[])
      .catch(err => this.appService.handleError(err));
  }
}
