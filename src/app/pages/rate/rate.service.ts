import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions, ResponseContentType } from '@angular/http';
import { Rate } from './rate';
import { AppService } from '../../../app/app.service';
import { saveFile, getFileNameFromResponseContentDisposition } from '../../file-download-helper';

import 'rxjs/add/operator/toPromise';

@Injectable()

export class RateService {

  aRate: Rate[]= [];
  rate_id: any= null;
  rate: Rate= new Rate;

  constructor(private http: Http, private app_service: AppService) {}

  get_RateList(): Promise<Rate[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    return this.http.get(this.app_service.apiUrlRates, options).toPromise()
    .then(response => response.json() as Rate[]).catch(response => this.app_service.handleError(response));
  }

  get_RateData(rate_id): Promise<Rate> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url5 = `${this.app_service.apiUrlRates}/${rate_id}`;
    return this.http.get(url5, options).toPromise()
    .then(response => response.json() as Rate).catch(response => this.app_service.handleError(response));
  }

  add_Rate(rate: Rate): Promise<Rate> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(rate);
    const addUrl = `${this.app_service.apiUrlRates}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Rate)
    .catch(response => this.app_service.handleError(response));
  }

  update_Rate(rate: Rate): Promise<Rate> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(rate);
    const updateUrl = `${this.app_service.apiUrlRates}/${rate.rate_id}`;
    return this.http.put(updateUrl, body, options).toPromise().then(response => response.json() as Rate)
    .catch(response => this.app_service.handleError(response));
  }

  delete_Rate(rate_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deleteUrl = `${this.app_service.apiUrlRates}/${rate_id}`;
    return this.http.delete(deleteUrl, options).toPromise().then(response => response.json() as Rate)
   .catch(response => this.app_service.handleError(response));
  }

  getSampleCSV() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    options.responseType = ResponseContentType.Blob;
    const url = `${this.app_service.apiUrlRates}/sample/csv`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }

  getRateCSV(): any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    options.responseType = ResponseContentType.Blob;
    const url = `${this.app_service.apiUrlRates}/csv/file`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
