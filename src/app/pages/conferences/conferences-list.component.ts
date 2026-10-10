import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ConferenceCenterService } from './conferences.service';
import { ConferenceCenter } from './conferences';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { AppService } from '../../../app/app.service';
import { Http, Headers, RequestOptions } from '@angular/http';

@Component({
  selector: 'ngx-conferences-list',
  templateUrl: './conferences-list.component.html',
})
export class ConferencesListComponent implements OnInit, OnDestroy {

  items: ConferenceCenter[] = [];
  deleteUuid: string;
  private windowRef: NbWindowRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  // Live participant panel state
  liveUuid: string | null = null;
  liveRoom: string = '';
  liveMembers: any[] = [];
  liveLoading = false;
  liveError = '';
  private liveTimer: any = null;
  pendingAction: string | null = null;

  constructor(
    private service: ConferenceCenterService,
    private router: Router,
    private windowService: NbWindowService,
    private app_service: AppService,
    private http: Http,
  ) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
    }
    this.loadList();
  }

  ngOnDestroy() {
    this.stopLivePoll();
  }

  loadList() {
    this.service.getList(this.selectedTenant).then(data => this.items = data || []);
  }

  toggleLive(uuid: string) {
    if (this.liveUuid === uuid) {
      this.stopLivePoll();
      this.liveUuid = null;
      this.liveMembers = [];
      this.liveError = '';
      return;
    }
    this.liveUuid = uuid;
    this.liveMembers = [];
    this.liveError = '';
    this.loadParticipants();
    this.startLivePoll();
  }

  loadParticipants() {
    if (!this.liveUuid) return;
    this.liveLoading = true;
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    this.http.get(`${this.app_service.apiUrlConferenceParticipants}?conference_uuid=${this.liveUuid}`, options)
      .toPromise()
      .then(r => {
        const d = r.json();
        this.liveRoom = d.conference_center_extension || '';
        this.liveMembers = d.members || [];
        this.liveError = '';
      })
      .catch(() => { this.liveError = 'Failed to fetch participants.'; })
      .then(() => { this.liveLoading = false; });
  }

  startLivePoll() {
    this.stopLivePoll();
    this.liveTimer = setInterval(() => this.loadParticipants(), 5000);
  }

  stopLivePoll() {
    if (this.liveTimer) { clearInterval(this.liveTimer); this.liveTimer = null; }
  }

  controlParticipant(action: string, memberId: number) {
    if (!this.liveUuid) return;
    this.pendingAction = `${action}-${memberId}`;
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    const body = JSON.stringify({ conference_uuid: this.liveUuid, action, member_id: memberId });
    this.http.post(this.app_service.apiUrlConferenceParticipants, body, options)
      .toPromise()
      .then(() => { setTimeout(() => this.loadParticipants(), 500); })
      .catch(() => { this.liveError = `Action '${action}' failed.`; })
      .then(() => { this.pendingAction = null; });
  }

  isMuted(m: any): boolean {
    return (m.status || '').toLowerCase().includes('mute');
  }

  openDeleteDialog(uuid: string, tmpl) {
    this.deleteUuid = uuid;
    this.windowRef = this.windowService.open(tmpl, { title: 'Confirm Delete' });
  }

  confirmDelete() {
    this.service.delete(this.deleteUuid).then(() => {
      if (this.windowRef) this.windowRef.close();
      this.loadList();
    }).catch(err => {
      if (this.windowRef) this.windowRef.close();
      try {
        const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
        this.app_service.errors = body?.error?.message || 'Error while deleting Conference';
      } catch { this.app_service.errors = 'Error while deleting Conference'; }
      setTimeout(() => { this.app_service.errors = ''; }, 8000);
    });
  }

  cancelDelete() {
    if (this.windowRef) this.windowRef.close();
  }
}
