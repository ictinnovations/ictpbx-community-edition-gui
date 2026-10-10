import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { AppService } from '../app.service';
import 'rxjs/add/operator/toPromise';

@Injectable({ providedIn: 'root' })
export class ExtensionCheckService {

  constructor(private http: Http, private appService: AppService) {}

  nextAvailable(): Promise<string> {
    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http
      .get(`${this.appService.apiUrlFpbxExtensions}/next_available`, options)
      .toPromise()
      .then(r => (r.json() as any).next_available as string)
      .catch(() => '');
  }

  check(extension: string): Promise<{ available: boolean; used_by?: string }> {
    if (!extension) return Promise.resolve({ available: true });
    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    return this.http
      .get(`${this.appService.apiUrlFpbxExtensions}/check?extension=${encodeURIComponent(extension)}`, options)
      .toPromise()
      .then(r => r.json() as { available: boolean; used_by?: string })
      .catch(() => ({ available: true }));
  }

  availableForFax(excludeAccountId?: number): Promise<{ extension_uuid: string; extension: string }[]> {
    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    const url = excludeAccountId
      ? `${this.appService.apiUrlFpbxExtensions}/available_for_fax?exclude_account_id=${excludeAccountId}`
      : `${this.appService.apiUrlFpbxExtensions}/available_for_fax`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() || [])
      .catch(() => []);
  }
}
