import { Injectable } from '@angular/core';
import { Http, Response, HttpModule, RequestOptions, Headers, ResponseContentType } from '@angular/http';
import { AppService } from '../../../app/app.service';
import { getFileNameFromResponseContentDisposition, saveFile } from '../../file-download-helper';

import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import { SendFax } from '../sendfax/sendfax';

@Injectable()

export class InFaxService {

  sendfax: SendFax = new SendFax;

  constructor(private app_service: AppService, private http: Http) { }

  get_InFaxTransmissionList(
    pagesize: number | null = null,
    pageIndex: number | null = null,
    filter: string | null = null
  ) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
  
    let getUrl = `${this.app_service.apiUrlTransmission}?$service_flag=2&status=completed&origin=faxtoemail`;      if (pagesize && pageIndex) {
      getUrl += `&pagesize=${pagesize}&pageIndex=${pageIndex}`;
    }
      if (filter) {
      getUrl += `&${filter}`;
    }
    console.log('Constructed URL:', getUrl);
      return this.http.get(getUrl, options)
      .toPromise()
      .then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }
  get_unread_infaxTransmissionList(){
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    var getUrl = `${this.app_service.apiUrlTransmission}?$service_flag=2&status=completed&origin=faxtoemail&pagesize=50&pageIndex=0`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
    
  }
  get_InFaxTransmissionList_tr(tenant_id) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    var getUrl = `${this.app_service.apiUrlTransmission}?origin=faxtoemail?tenant_id=${tenant_id}`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  gettotalrows(){
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getUrl = `${this.app_service.apiUrlTransmission}?$service_flag=2&status=completed&origin=faxtoemail&totalrows`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  get_AccountList(user_id ): Promise<any[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getUrl = `${this.app_service.apiUrlAccounts}?created_by=${user_id}&type=did`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  get_Documentdownload(document_id): any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    options.responseType = ResponseContentType.Blob;
    const url = `${this.app_service.apiUrlDocument}/${document_id}/media`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }

  get_Bulkdownload(filters: string) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = {
      headers: headers, responseType: ResponseContentType.Blob,
    };

    // Construct the URL with filters and date range
    const url = `${this.app_service.apiUrlBulk}?${filters}`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res)
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }



  getTransmissionResult(transmission_id) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const getUrl = `${this.app_service.apiUrlTransmission}/${transmission_id}/results?name=document`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  update_inbound(transmission_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(this.sendfax);
    const updateUrl = `${this.app_service.apiUrlTransmission}/${transmission_id}`;
    return this.http.put(updateUrl, body, options).toPromise().then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }

  delete_Transmission(transmission_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deletetransmissionUrl = `${this.app_service.apiUrlTransmission}/${transmission_id}`;
    return this.http.delete(deletetransmissionUrl, options).toPromise().then(response => response.json())
    .catch(response => this.app_service.handleError(response));
  }

  confirmed_Download(transmission_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const getUrl = `${this.app_service.apiUrlTransmission}/downloaded/${transmission_id}`;
    return this.http.delete(getUrl, options).toPromise().then(response => response.json())
    .catch(response => this.app_service.handleError(response));
    return this.http.get(getUrl, options).toPromise()
      .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  count() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const getUrl = `${this.app_service.apiUrlTransmission}/notify`;
    return this.http.get(getUrl, options).toPromise()
      .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

}
