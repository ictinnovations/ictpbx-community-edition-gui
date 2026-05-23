import { Component, OnInit, OnDestroy } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions } from '@angular/http';
import { AppService } from '../../../app/app.service';

import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-realtime',
  templateUrl: './realtime.component.html',
})
export class RealtimeComponent implements OnInit, OnDestroy {

  channelCount = 0;
  registrationCount = 0;
  channels: any[] = [];
  registrations: any[] = [];
  lastUpdated: Date;
  private timer: any;
  loading = false;

  pendingUuid: string = null;
  transferUuid: string = null;
  transferDest: string = '';

  constructor(private http: Http, private app_service: AppService) {}

  ngOnInit() {
    this.poll();
    this.timer = setInterval(() => this.poll(), 5000);
  }

  ngOnDestroy() {
    if (this.timer) { clearInterval(this.timer); }
  }

  poll() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    this.http.get(this.app_service.apiUrlRealtime, options).toPromise()
      .then(r => {
        const data = r.json();
        this.channelCount      = data.channel_count || 0;
        this.registrationCount = data.registration_count || 0;
        this.channels          = data.channels || [];
        this.registrations     = data.registrations || [];
        this.lastUpdated       = new Date();
      })
      .catch(() => {});
  }

  controlCall(action: string, uuid: string, destination?: string) {
    this.pendingUuid = uuid;
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify({ action, channel_uuid: uuid, destination: destination || '' });
    this.http.post(this.app_service.apiUrlRealtime + '/control', body, options).toPromise()
      .then(() => {
        if (action === 'transfer') { this.transferUuid = null; this.transferDest = ''; }
        setTimeout(() => this.poll(), 600);
      })
      .catch(() => {})
      .then(() => { if (this.pendingUuid === uuid) this.pendingUuid = null; });
  }

  startTransfer(uuid: string) {
    this.transferUuid = uuid;
    this.transferDest = '';
  }

  cancelTransfer() {
    this.transferUuid = null;
    this.transferDest = '';
  }

  isHeld(ch: any): boolean {
    return (ch.callstate || '').toUpperCase() === 'HELD';
  }
}
