import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, Response, HttpModule, RequestOptions } from '@angular/http';
import { Plan } from './plan';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()

export class PlanService {

  aPlan: Plan[]= [];
  plan_id: any= null;
  plan: Plan= new Plan;

  constructor(private http: Http, private app_service: AppService) {}

  get_PlanList(): Promise<Plan[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    return this.http.get(this.app_service.apiUrlPlans, options).toPromise()
    .then(response => response.json() as Plan[]).catch(response => this.app_service.handleError(response));
  }

  get_PlanData(plan_id): Promise<Plan> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url5 = `${this.app_service.apiUrlPlans}/${plan_id}`;
    return this.http.get(url5, options).toPromise()
    .then(response => response.json() as Plan).catch(response => this.app_service.handleError(response));
  }

  add_Plan(plan: Plan): Promise<Plan> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(plan);
    const addUrl = `${this.app_service.apiUrlPlans}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() as Plan)
    .catch(response => this.app_service.handleError(response));
  }

  update_Plan(plan: Plan): Promise<Plan> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(plan);
    const updateUrl = `${this.app_service.apiUrlPlans}/${plan.plan_id}`;
    return this.http.put(updateUrl, body, options).toPromise().then(response => response.json() as Plan)
    .catch(response => this.app_service.handleError(response));
  }

  delete_Plan(plan_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deleteUrl = `${this.app_service.apiUrlPlans}/${plan_id}`;
    return this.http.delete(deleteUrl, options).toPromise().then(response => response.json() as Plan)
   .catch(response => this.app_service.handleError(response));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
