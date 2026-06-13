import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Injectable({ providedIn: 'root' })
export class FpbxCdrService {

  constructor(private http: Http, private app_service: AppService) {}

  getList(limit: number, offset: number, filter: string = ''): Promise<{ rows: any[]; total: number }> {
    try {
      const headers = new Headers();
      this.app_service.createAuthorizationHeader(headers);
      const options = new RequestOptions({ headers });
      const url = `${this.app_service.apiUrlFpbxCdr}?limit=${limit}&offset=${offset}${filter}`;
      return this.http.get(url, options).toPromise()
        .then(r => r.json())
        .catch(() => ({ rows: [], total: 0 }));
    } catch (e) {
      return Promise.resolve({ rows: [], total: 0 });
    }
  }
}
