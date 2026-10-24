import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Ivr } from './ivr';
import { IvrService } from './ivr.service';
import { AppService } from '../../../app/app.service';
import { Http, RequestOptions } from '@angular/http';
import { Headers } from '@angular/http';

@Component({
  selector: 'ngx-add-ivr-component',
  templateUrl: './ivr-form-component.html',
  styleUrls: ['./ivr-form-component.scss'],
})
export class AddIvrComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router,
    private ivr_service: IvrService, private app_service: AppService,
    private http: Http) { }

  ivr: Ivr = new Ivr();
  program_id: any = null;
  recording: any[] = [];
  extension: any[] = [];
  menu: any[] = [
    { name: 'Caller ID Number', value: '${caller_id_number}' },
    { name: 'Caller ID Name', value: '${caller_id_name}' },
  ];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.program_id = +params['id'];
      const segments = this.router.url.split('/');
      if (segments[segments.length - 1] !== 'new') {
        this.ivr_service.get_IvrData(this.program_id).then(data => {
          this.ivr = data;
        });
      }
    });
    this.loadRecordings();
    this.loadExtensions();
  }

  private loadRecordings() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    this.http.get(this.app_service.apiUrlRecording, options).toPromise()
      .then(response => { this.recording = response.json(); })
      .catch(() => { });
  }

  private loadExtensions() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    this.http.get(`${this.app_service.apiUrl}/accounts`, options).toPromise()
      .then(response => { this.extension = response.json(); })
      .catch(() => { });
  }

  postIVRData(): void {
    this.ivr_service.add_Ivr(this.ivr).then(() => {
      this.router.navigate(['../../ivr'], { relativeTo: this.route });
    });
  }

  updateIVRData(): void {
    this.ivr_service.update_Ivr(this.ivr).then(() => {
      this.router.navigate(['../../ivr'], { relativeTo: this.route });
    }).catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
