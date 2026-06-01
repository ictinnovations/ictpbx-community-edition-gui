import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { AppService } from '../../../app/app.service';

@Component({
  selector: 'ngx-feature-codes',
  templateUrl: './feature-codes.component.html',
})
export class FeatureCodesComponent implements OnInit {

  items: any[] = [];
  loading = false;
  error = '';
  filter = '';

  constructor(private http: Http, private app_service: AppService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    this.http.get(`${this.app_service.apiUrl}/feature_codes`, options).toPromise()
      .then(r => { this.items = r.json() || []; })
      .catch(() => { this.error = 'Failed to load feature codes.'; })
      .then(() => { this.loading = false; });
  }

  get filtered(): any[] {
    if (!this.filter) return this.items;
    const q = this.filter.toLowerCase();
    return this.items.filter(i =>
      (i.dialplan_number || '').toLowerCase().includes(q) ||
      (i.dialplan_name || '').toLowerCase().includes(q) ||
      (i.dialplan_description || '').toLowerCase().includes(q)
    );
  }
}
