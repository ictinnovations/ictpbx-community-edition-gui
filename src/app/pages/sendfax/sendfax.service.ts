import {Injectable} from '@angular/core';
import {Headers} from '@angular/http';
import {Http, Response, HttpModule, RequestOptions} from '@angular/http';
import {SendFax, DocumentProgram} from './sendfax';
import {AppService} from '../../../app/app.service';


import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import { Faxactivity, Faxlogs } from './faxlogs';

@Injectable()

export class SendFaxService {

  aSendFax: SendFax[] = [];
  transmission_id: any = null;
  sendfax: SendFax = new SendFax;
  documentProgram: DocumentProgram = new DocumentProgram;
  form: any;

  constructor(private http: Http, private app_service: AppService) {}

  get_OutFaxTransmissionList(tenant = 0,pageSize = null,pageIndex = null,filter= null): Promise<SendFax[]> {    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});

    const tenantParam = tenant > 0 ? `&tenant_id=${tenant}` : '';
    var getUrl = `${this.app_service.apiUrlTransmission}?service_flag=2&direction=outbound${tenantParam}`;
    if(pageSize){
      var getUrl = `${this.app_service.apiUrlTransmission}?service_flag=2&direction=outbound${tenantParam}&pagesize=${pageSize}&pageIndex=${pageIndex}`;
      }
    if(filter){
      var getUrl = getUrl+'&'+filter;
        }
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json() as SendFax[]).catch(response => this.app_service.handleError(response));
  }

     set_retry_interval(set_interval){
        const headers = new Headers();
        this.app_service.createAuthorizationHeader(headers);
        const options = new RequestOptions({headers: headers});
        const body = JSON.stringify(set_interval);
        const addUrl = `${this.app_service.apiUrlTransmission}/retryinterval`;
        return this.http.put(addUrl, body, options).toPromise()
        .catch(response => this.app_service.handleError(response));
      }
   
      get_retry_interval(){
        const headers = new Headers();
        this.app_service.createAuthorizationHeader(headers);
        const options = new RequestOptions({headers: headers});
        const addUrl = `${this.app_service.apiUrlTransmission}/getretryinterval`;
        return this.http.get(addUrl , options).toPromise()
        .then(response => response.json()) 
        .catch(response => this.app_service.handleError(response));
      }
      

  get_OutFaxtransmissionList_tr(tenant_id: number): Promise<SendFax[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    let getUrl = `${this.app_service.apiUrlTransmission}?direction=outbound&tenant_id=${tenant_id}`;
   
      return this.http.get(getUrl, options).toPromise()
      .then(response => response.json() as SendFax[]) 
      .catch(error => this.app_service.handleError(error));
  }
  gettotalnumberrows(){
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    var getUrl = `${this.app_service.apiUrlTransmission}?service_flag=2&direction=outbound&totalrows`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  add_SendFax(sendfax: SendFax): Promise<number> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(sendfax);
    const addTransmissionUrl = `${this.app_service.apiUrlTransmission}`;
    return this.http.post(addTransmissionUrl, body, options).toPromise().then(response => response.json() as Number)
    .catch(response => this.app_service.handleError(response));
  }

  add_senddocument(documentProgram: DocumentProgram): Promise<number> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(documentProgram);
    const addSendFaxUrl = `${this.app_service.apiUrlPrograms}/sendfax`;
    return this.http.post(addSendFaxUrl, body, options).toPromise().then(response => response.json() as Number)
    .catch(response => this.app_service.handleError(response));
  }

  send_transmission(transmission_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const sendurl = `${this.app_service.apiUrlTransmission}/${transmission_id}/send`;
    return this.http.post(sendurl, '', options).toPromise().then(response => {})
    .catch(response => this.app_service.handleError(response));
  }

  get_AccountList(): Promise<any[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getUrl = `${this.app_service.apiUrlAccounts}/my`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }


  delete_Document(transmission_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deletetransmissionUrl = `${this.app_service.apiUrlTransmission}/${transmission_id}`;
    return this.http.delete(deletetransmissionUrl, options).toPromise().then(response => response.json() as SendFax)
    .catch(response => this.app_service.handleError(response));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  getfaxlogs(transmission_id): Promise<any[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getUrl = `${this.app_service.apiUrlTransmission}/faxlogs/${transmission_id}`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json() as Faxlogs[]).catch(response => this.app_service.handleError(response));
  }

  getfaxactivity(transmission_id): Promise<any[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const getUrl = `${this.app_service.apiUrlTransmission}/faxactivity/${transmission_id}`;
    return this.http.get(getUrl, options).toPromise()
    .then(response => response.json() as Faxactivity[]).catch(response => this.app_service.handleError(response));
  }
}
