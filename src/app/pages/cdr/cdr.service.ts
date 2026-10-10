import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions, ResponseContentType } from '@angular/http';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { saveFile, getFileNameFromResponseContentDisposition } from '../../file-download-helper';

@Injectable()
export class CDRService {

  constructor(private http: Http, private app_service: AppService) { }

  /**
   * Unified CDR list (voice + fax) — reads ICTCore /cdr (cdr_lega LEFT JOIN cdr_legb).
   * cdr_lega is the single source of truth per unified-billing architecture.
   */
  get_CDRlist(filter: string | null = null, pagesize: number | null = null, pageindex: number | null = null) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });

    const limit  = pagesize  ? pagesize  : 500;
    const offset = (pagesize && pageindex) ? (pagesize * pageindex) : 0;

    let url = `${this.app_service.apiUrlCdrList}?limit=${limit}&offset=${offset}`;
    if (filter) url += filter;

    return this.http.get(url, options).toPromise()
      .then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }

  gettotalrows(tenant: number = 0) {
    // /cdr has no totalrows endpoint yet; fall back to list length client-side.
    // Returning a large bound keeps Mat-paginator from clamping.
    return Promise.resolve(5000);
  }

  exportCDR(monthly: boolean, filter: string | null = null) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    options.responseType = ResponseContentType.Blob;
    let url = `${this.app_service.apiUrlCDR}?limit=5000`;
    if (filter) url += filter;
    if (monthly) url += '&monthly=true';
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res) || 'cdr.csv';
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }
}
