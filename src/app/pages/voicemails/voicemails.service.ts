import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { Voicemail } from './voicemails';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class VoicemailService {

  constructor(private http: Http, private app_service: AppService) {}

  get_VoicemailList(tenantId: number = 0): Promise<Voicemail[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    let url = this.app_service.apiUrlVoicemails;
    if (tenantId > 0) url += `?tenant_id=${tenantId}`;
    return this.http.get(url, options).toPromise()
      .then(r => r.json() as Voicemail[])
      .catch(e => this.app_service.handleError(e));
  }

  get_VoicemailData(voicemail_uuid: string): Promise<Voicemail> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.app_service.apiUrlVoicemails}/${voicemail_uuid}`, options).toPromise()
      .then(r => r.json() as Voicemail)
      .catch(e => this.app_service.handleError(e));
  }

  add_Voicemail(v: Voicemail): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.app_service.apiUrlVoicemails, JSON.stringify(v), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  update_Voicemail(v: Voicemail): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.put(`${this.app_service.apiUrlVoicemails}/${v.voicemail_uuid}`, JSON.stringify(v), options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  delete_Voicemail(voicemail_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlVoicemails}/${voicemail_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  deleteGreeting(greeting_uuid: string): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.app_service.apiUrlVoicemailGreetings}/${greeting_uuid}`, options).toPromise()
      .then(r => r.json())
      .catch(e => this.app_service.handleError(e));
  }

  uploadGreeting(voicemail_uuid: string, file: File, greeting_name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd  = new FormData();
      fd.append('file', file);
      fd.append('voicemail_uuid', voicemail_uuid);
      fd.append('greeting_name', greeting_name);
      xhr.open('POST', this.app_service.apiUrlVoicemailGreetings, true);
      const authHeaders = this.app_service.upload_Header;
      authHeaders.forEach(h => xhr.setRequestHeader(h.name, h.value));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new Error(xhr.responseText));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(fd);
    });
  }
}
