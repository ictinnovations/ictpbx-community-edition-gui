import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, Response, HttpModule, RequestOptions } from '@angular/http';
import { coverpage } from './coverpage';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';
@Injectable({
  providedIn: 'root'
})
export class CoverpageService {
  acoverpage: coverpage[]= [];
  cover_id: any= null;
  cover_page: coverpage= new coverpage;

  constructor(private http: Http, private app_service: AppService) {}
  

  add_Coverpage(cover_page: coverpage): Promise<coverpage> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(cover_page);
    const addUrl = `${this.app_service.apiUrlCover}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as coverpage)
    .catch(response => this.app_service.handleError(response));
  }
  
  get_CoverpageList(tenant_id = null) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const is_admin = localStorage.getItem('is_admin');
    const is_tenant = localStorage.getItem('is_tenant');
    const user_id = localStorage.getItem('aid');
    if(is_admin == '1'){
       var geturl = `${this.app_service.apiUrlCovers}`;
      }
      else if(is_tenant == '1')
        {
         var geturl = `${this.app_service.apiUrlCovers}?tenant_id=${tenant_id}`;
        }
      else{
       var geturl = `${this.app_service.apiUrlCovers}?created_by=${user_id}`;
      }

    return this.http.get(geturl, options).toPromise()
    .then(response => response.json() ).catch(response => this.app_service.handleError(response));
  }

  delete_Coverpage(id){
      const headers = new Headers();
      this.app_service.createAuthorizationHeader(headers);
      const options = new RequestOptions({headers: headers});
      const deleteUrl = `${this.app_service.apiUrlCover}/${id}`;
      return this.http.delete(deleteUrl, options).toPromise().then(response => response.json() as coverpage)
      .catch(response => this.app_service.handleError(response));
     }
  Update_Coverpage(cover:coverpage): Promise<coverpage>{
      const headers = new Headers();
      this.app_service.createAuthorizationHeader(headers);
      const options = new RequestOptions({headers: headers});
      const body = JSON.stringify(cover);
      const updateUrl = `${this.app_service.apiUrlCover}/${cover.coverpage_id}`;
      return this.http.put(updateUrl, body, options).toPromise().then(response => response.json() as coverpage)
      .catch(response => this.app_service.handleError(response));
      

     }
     get_Coverpage(coverpage_id): Promise<coverpage> {
      const headers = new Headers();
      this.app_service.createAuthorizationHeader(headers);
      const options = new RequestOptions({ headers: headers});
      const url5 = `${this.app_service.apiUrlCover}/${coverpage_id}`;
      return this.http.get(url5, options).toPromise()
      .then(response => response.json() as coverpage).catch(response => this.app_service.handleError(response));
    }
}
