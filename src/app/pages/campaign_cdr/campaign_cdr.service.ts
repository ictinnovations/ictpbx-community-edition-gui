import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions, ResponseContentType } from '@angular/http';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { saveFile, getFileNameFromResponseContentDisposition } from '../../file-download-helper';
import * as FileSaver from 'file-saver';

@Injectable()

export class CampaignCDRService {

  campaign_id:any;

  constructor(private http: Http, private app_service: AppService) { }

  get_CDRlist() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrlSpool}?direction=outbound&campaign_id=${this.campaign_id}`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  getSampleCSV() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    options.responseType = ResponseContentType.Blob;
    const url = `${this.app_service.apiUrlCDR}?direction=outbound&campaign_id=${this.campaign_id}`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }
}  