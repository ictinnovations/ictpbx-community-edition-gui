import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { Text } from './text';
import { AppService } from '../../../../app/app.service';

@Injectable()
export class TextService {

  constructor(private http: Http, private app_service: AppService) { }

  get_TextList(): Promise<Text[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(this.app_service.apiUrlText, options).toPromise()
      .then(response => response.json() as Text[])
      .catch(response => this.app_service.handleError(response));
  }

  get_TextData(text_id): Promise<Text> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlText}/${text_id}`;
    return this.http.get(url, options).toPromise()
      .then(response => response.json() as Text)
      .catch(response => this.app_service.handleError(response));
  }

  add_Text(text: Text): Promise<Text> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(text);
    return this.http.post(this.app_service.apiUrlText, body, options).toPromise()
      .then(response => response.json() as Text)
      .catch(response => this.app_service.handleError(response));
  }

  update_Text(text: Text): Promise<Text> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(text);
    const url = `${this.app_service.apiUrlText}/${text.text_id}`;
    return this.http.put(url, body, options).toPromise()
      .then(response => response.json() as Text)
      .catch(response => this.app_service.handleError(response));
  }

  delete_Text(text_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlText}/${text_id}`;
    return this.http.delete(url, options).toPromise()
      .then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }
}
