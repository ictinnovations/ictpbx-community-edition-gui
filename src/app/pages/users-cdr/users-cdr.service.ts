import { Injectable } from '@angular/core';
import { Http, RequestOptions, ResponseContentType } from '@angular/http';
import { Headers } from '@angular/http';

import { AppService } from '../../app.service';
import { getFileNameFromResponseContentDisposition, saveFile } from '../../file-download-helper';

@Injectable({
  providedIn: 'root'
})
export class UsersCdrService {
  
  constructor(private http: Http, private app_service: AppService) { }

  usersCDR_list( ){
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    var url = `${this.app_service.apiUrlusers_cdr}`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }
  
  exportCDR(filter) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    options.responseType = ResponseContentType.Blob;
    const url = `${this.app_service.apiUrlusers_cdr}/csv?${filter}`;
      this.http.get(url, options).subscribe(res => {
        const fileName = getFileNameFromResponseContentDisposition(res);
        console.log(res);
        saveFile(res.blob(), fileName);
      }, error => {
        this.app_service.downloadError(error)
      });
    }


  get_filteredList(filter ) {
    console.log(filter);
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    var url = `${this.app_service.apiUrlusers_cdr}?${filter}`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

}
