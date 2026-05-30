import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Headers, Http, RequestOptions } from '@angular/http';
import { FpbxCdr } from './fpbx_cdr';
import { FpbxCdrService } from './fpbx_cdr.service';
import { AppService } from '../../../app/app.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-fpbx-cdr',
  templateUrl: './fpbx_cdr.component.html',
})
export class FpbxCdrComponent implements OnInit, OnDestroy {

  rows: FpbxCdr[] = [];
  total: number = 0;
  pageSize: number = 25;
  pageIndex: number = 0;
  loading: boolean = false;
  filter: string = '';
  direction: string = '';

  etlStatus: any = null;
  etlTriggering: boolean = false;
  private etlPollTimer: any = null;

  range = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

  constructor(private service: FpbxCdrService, private http: Http, private app_service: AppService) {}

  ngOnInit() {
    this.load();
    this.loadEtlStatus();
  }

  ngOnDestroy() {
    this.stopEtlPoll();
  }

  load() {
    this.loading = true;
    this.service.getList(this.pageSize, this.pageIndex * this.pageSize, this.filter)
      .then(data => {
        this.rows  = data.rows  || [];
        this.total = data.total || 0;
        this.loading = false;
      })
      .catch(() => {
        this.rows  = [];
        this.total = 0;
        this.loading = false;
      });
  }

  applyFilter() {
    this.filter = '';
    if (this.range.value.start)
      this.filter += `&start_date=${new Date(this.range.value.start).toISOString().slice(0, 10)}`;
    if (this.range.value.end)
      this.filter += `&end_date=${new Date(this.range.value.end).toISOString().slice(0, 10)}`;
    if (this.direction)
      this.filter += `&direction=${this.direction}`;
    this.pageIndex = 0;
    this.load();
  }

  clearFilter() {
    this.range.reset();
    this.direction = '';
    this.filter = '';
    this.pageIndex = 0;
    this.load();
  }

  prevPage() { if (this.pageIndex > 0) { this.pageIndex--; this.load(); } }
  nextPage() { if ((this.pageIndex + 1) * this.pageSize < this.total) { this.pageIndex++; this.load(); } }

  get pageStart() { return this.total === 0 ? 0 : this.pageIndex * this.pageSize + 1; }
  get pageEnd()   { return Math.min((this.pageIndex + 1) * this.pageSize, this.total); }

  private authOptions(): RequestOptions {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    return new RequestOptions({ headers });
  }

  loadEtlStatus() {
    this.http.get(this.app_service.apiUrlCdrEtl + '/status', this.authOptions()).toPromise()
      .then(r => { this.etlStatus = r.json(); })
      .catch(() => {});
  }

  runEtl() {
    this.etlTriggering = true;
    this.http.post(this.app_service.apiUrlCdrEtl + '/run', '{}', this.authOptions()).toPromise()
      .then(r => {
        const res = r.json();
        if (res.status === 'started') {
          this.etlStatus = { running: true, started_at: new Date().toISOString() };
          this.startEtlPoll();
        } else {
          this.etlStatus = res;
        }
      })
      .catch(() => {})
      .then(() => { this.etlTriggering = false; });
  }

  private startEtlPoll() {
    this.stopEtlPoll();
    this.etlPollTimer = setInterval(() => {
      this.http.get(this.app_service.apiUrlCdrEtl + '/status', this.authOptions()).toPromise()
        .then(r => {
          this.etlStatus = r.json();
          if (!this.etlStatus?.running) {
            this.stopEtlPoll();
            this.load();
          }
        })
        .catch(() => {});
    }, 3000);
  }

  private stopEtlPoll() {
    if (this.etlPollTimer) { clearInterval(this.etlPollTimer); this.etlPollTimer = null; }
  }
}
