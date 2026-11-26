import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, Response, HttpModule, RequestOptions } from '@angular/http';
import { Payment } from './payment';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()

export class PaymentService {

  aPayment: Payment[]= [];
  payment_id: any= null;
  payment: Payment= new Payment;

  constructor(private http: Http, private app_service: AppService) {}

  get_PaymentList(tenantId: number = 0): Promise<Payment[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    let url = this.app_service.apiUrlPayments;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
    .then(response => response.json() as Payment[]).catch(response => this.app_service.handleError(response));
  }

  get_PaymentData(payment_id): Promise<Payment> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url5 = `${this.app_service.apiUrlPayments}/${payment_id}`;
    return this.http.get(url5, options).toPromise()
    .then(response => response.json() as Payment).catch(response => this.app_service.handleError(response));
  }

  add_Payment(payment: Payment): Promise<Payment> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(payment);
    const addUrl = `${this.app_service.apiUrlPayments}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Payment)
    .catch(response => this.app_service.handleError(response));
  }

  update_Payment(payment: Payment): Promise<Payment> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(payment);
    const updateUrl = `${this.app_service.apiUrlPayments}/${payment.payment_id}`;
    return this.http.put(updateUrl, body, options).toPromise().then(response => response.json() as Payment)
    .catch(response => this.app_service.handleError(response));
  }

  delete_Payment(payment_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deleteUrl = `${this.app_service.apiUrlPayments}/${payment_id}`;
    return this.http.delete(deleteUrl, options).toPromise().then(response => response.json() as Payment)
   .catch(response => this.app_service.handleError(response));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
