import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions, ResponseContentType } from '@angular/http';
import { Recording } from './recording';
import { AppService } from '../../../../app/app.service';
import { saveFile, getFileNameFromResponseContentDisposition } from '../../../file-download-helper';

@Injectable()
export class RecordingService {

  constructor(private http: Http, private app_service: AppService) { }

  get_RecordingList(): Promise<Recording[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    return this.http.get(this.app_service.apiUrlRecording, options).toPromise()
      .then(response => response.json() as Recording[])
      .catch(response => this.app_service.handleError(response));
  }

  get_RecordingData(recording_id): Promise<Recording> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlRecording}/${recording_id}`;
    return this.http.get(url, options).toPromise()
      .then(response => response.json() as Recording)
      .catch(response => this.app_service.handleError(response));
  }

  add_Recording(recording: Recording): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(recording);
    return this.http.post(this.app_service.apiUrlRecording, body, options).toPromise()
      .then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }

  update_Recording(recording: Recording): Promise<Recording> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(recording);
    const url = `${this.app_service.apiUrlRecording}/${recording.recording_id}`;
    return this.http.put(url, body, options).toPromise()
      .then(response => response.json() as Recording)
      .catch(response => this.app_service.handleError(response));
  }

  delete_Recording(recording_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlRecording}/${recording_id}`;
    return this.http.delete(url, options).toPromise()
      .then(response => response.json())
      .catch(response => this.app_service.handleError(response));
  }

  get_Recordingdownload(recording_id): void {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers, responseType: ResponseContentType.Blob });
    const url = `${this.app_service.apiUrlRecording}/${recording_id}/media`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => this.app_service.downloadError(error));
  }
}
