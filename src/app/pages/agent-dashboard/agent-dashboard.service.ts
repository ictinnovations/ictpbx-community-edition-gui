import { Injectable } from '@angular/core';
import { AppService } from '../../app.service';
import { Http, RequestOptions } from '@angular/http';
import { AgentDashboard } from './agent-dashboard';
import { Headers } from '@angular/http';

@Injectable()
export class AgentDashboardService {

  constructor(private http: Http, private app_service: AppService) { }

  get_provisioning(account_id): Promise<AgentDashboard> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlAccounts}/${account_id}/provisioning`;
    return this.http.get(url, options).toPromise()
      .then(response => response.json() as AgentDashboard)
      .catch(response => this.app_service.handleError(response));
  }
}
