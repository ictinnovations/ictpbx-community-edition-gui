import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { AppService } from '../../app.service';
import { Announcement } from './announcement';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable({
  providedIn: 'root'
})
export class AnnnouncementService {
  announcement : Announcement = new Announcement;
  
  constructor(private http: Http, private app_service: AppService) { }

  getannouncement(tenantid = null) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});    
    const url = `${this.app_service.apiUrlAnnouncement}/${tenantid}`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  addannouncement(announcement: Announcement): Promise<Announcement> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(announcement);
    const addUrl = `${this.app_service.apiUrlAnnouncement}`;
    console.log(announcement);
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Announcement)
    .catch(response => this.app_service.handleError(response));
  }
}
