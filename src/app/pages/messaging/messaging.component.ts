import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AppService } from '../../app.service';

interface SmsThread {
  thread_key: string;
  last_body: string;
  last_direction: string;
  last_status: string;
  last_created: string;
}

interface SmsMessage {
  sms_id: number;
  direction: string;
  from_number: string;
  to_number: string;
  body: string;
  status: string;
  error: string;
  thread_key: string;
  created: string;
}

@Component({
  selector: 'ngx-messaging',
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss'],
})
export class MessagingComponent implements OnInit, OnDestroy {
  threads: SmsThread[] = [];
  messages: SmsMessage[] = [];
  activeThread = '';
  loadingThreads = false;
  loadingMessages = false;
  sending = false;
  error = '';
  composeBody = '';
  newNumber = '';
  showNew = false;
  private pollHandle: any;

  constructor(private http: HttpClient, private appService: AppService) {}

  ngOnInit() {
    this.loadThreads();
    // Light polling keeps the inbox fresh (inbound replies + delivery status).
    this.pollHandle = setInterval(() => {
      this.loadThreads(true);
      if (this.activeThread) this.loadMessages(this.activeThread, true);
    }, 15000);
  }

  ngOnDestroy() {
    if (this.pollHandle) clearInterval(this.pollHandle);
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('copy_token') ||
      JSON.parse(localStorage.getItem('auth_app_token') || '{}').value;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadThreads(silent = false) {
    if (!silent) this.loadingThreads = true;
    this.http.get<SmsThread[]>(this.appService.apiUrlSmsThreads, { headers: this.headers() })
      .subscribe({
        next: d => { this.loadingThreads = false; this.threads = d || []; },
        error: e => { this.loadingThreads = false; if (!silent) this.error = this.msg(e); },
      });
  }

  openThread(key: string) {
    this.activeThread = key;
    this.showNew = false;
    this.loadMessages(key);
  }

  loadMessages(key: string, silent = false) {
    if (!silent) this.loadingMessages = true;
    const params = new HttpParams().set('thread', key);
    this.http.get<SmsMessage[]>(this.appService.apiUrlSmsMessages, { headers: this.headers(), params })
      .subscribe({
        next: d => { this.loadingMessages = false; this.messages = d || []; },
        error: e => { this.loadingMessages = false; if (!silent) this.error = this.msg(e); },
      });
  }

  startNew() {
    this.showNew = true;
    this.activeThread = '';
    this.messages = [];
    this.newNumber = '';
    this.composeBody = '';
    this.error = '';
  }

  send() {
    const to = (this.activeThread || this.newNumber || '').trim();
    const body = this.composeBody.trim();
    if (!to || !body) return;
    this.sending = true;
    this.error = '';
    this.http.post<any>(this.appService.apiUrlSms, { to, body }, { headers: this.headers() })
      .subscribe({
        next: () => {
          this.sending = false;
          this.composeBody = '';
          const key = this.normalize(to);
          this.activeThread = key;
          this.showNew = false;
          this.newNumber = '';
          this.loadMessages(key);
          this.loadThreads(true);
        },
        error: e => { this.sending = false; this.error = this.msg(e); },
      });
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'delivered': return 'success';
      case 'sent':
      case 'queued':    return 'info';
      case 'received':  return 'primary';
      case 'failed':    return 'danger';
      default:          return 'basic';
    }
  }

  private normalize(n: string): string {
    return (n || '').replace(/[^0-9+]/g, '');
  }

  private msg(e: any): string {
    return e?.error?.error?.message || e?.error?.message || 'Request failed';
  }
}
