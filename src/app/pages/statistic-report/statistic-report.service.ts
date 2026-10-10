import { Injectable } from '@angular/core';

import { Headers } from '@angular/http';
import { Http, RequestOptions, ResponseContentType } from '@angular/http';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { saveFile, getFileNameFromResponseContentDisposition } from '../../file-download-helper';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class StatisticReportService {

  constructor(private http: Http, private app_service: AppService) { }

  get_CDRlist(filter = null, pageSize = null, pageIndex = null) {
    const tenant_id = parseInt(localStorage.getItem('tid'));
    const user_id = parseInt(localStorage.getItem('aid'));
    const is_admin = parseInt(localStorage.getItem('is_admin'));
    const is_tenant = parseInt(localStorage.getItem('is_tenant'));

    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = `${this.app_service.apiUrlSpoolStat}?`;
    if (pageSize) {
      url += `pageSize=${pageSize}&pageIndex=${pageIndex}&`;
    }
    // If filter contains a custom status, skip the default
    if (filter && filter.includes('status=')) {
      url += `service_flag=2`;
    } else {
      url += `status=completed,failed&service_flag=2`;
    }
    if (filter) url += filter;
    if (is_admin == 0 && is_tenant == 0) { url += `&user_id=${user_id}`; }
    else if (is_admin == 0 && is_tenant == 1) { url += `&tenant_id=${tenant_id}`; }
    return this.http.get(url, options).toPromise()
      .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  gettotalnumberrows() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    var getUrl = `${this.app_service.apiUrlSpoolStat}?status=completed,failed&service_flag=2&totalrows`;
    return this.http.get(getUrl, options).toPromise()
      .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  exportCDR(monthly, filter = null) {
    const tenant_id = parseInt(localStorage.getItem('tid'));
    const user_id = parseInt(localStorage.getItem('aid'));
    const is_admin = parseInt(localStorage.getItem('is_admin'));
    const is_tenant = parseInt(localStorage.getItem('is_tenant'));
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    options.responseType = ResponseContentType.Blob;
    // let url = `${this.app_service.apiUrlStat}?status=completed`;
    let url = `${this.app_service.apiUrlStat}?`;
    let status = null;

    // If filter contains a custom status, skip the default
    if (filter && filter.includes('status=')) {
      const match = filter.match(/(?:^|&)status=([^&]*)/);
      if (match && match[1]) {
        status = match[1];
        url += `status=${status}`;
      }
      // Remove status from filter
      filter = filter.replace(/(?:&)?status=[^&]*/, '');
      console.log(filter);
    } else {
      url += `status=completed,failed`;
    }

    if (filter) url += filter;
    if (is_admin == 0 && is_tenant == 0) { url += `&user_id=${user_id}`; }
    else if (is_admin == 0 && is_tenant == 1) { url += `&tenant_id=${tenant_id}`; }
    if (monthly) { url += "&monthly=true"; }
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      console.log(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error)
    });
  }

  get_AccountList() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(this.app_service.apiUrlAccounts, options).toPromise()
      .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }
}