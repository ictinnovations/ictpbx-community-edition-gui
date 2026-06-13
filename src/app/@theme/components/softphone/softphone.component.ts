import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SoftphoneService, CallState, SipConfig } from '../../../services/softphone.service';

@Component({
  selector: 'ngx-softphone',
  templateUrl: './softphone.component.html',
  styleUrls: ['./softphone.component.scss'],
})
export class SoftphoneComponent implements OnInit, OnDestroy {

  open = false;
  activeTab: 'dialer' | 'settings' = 'dialer';
  dialInput = '';

  registered = false;
  callState: CallState = 'idle';
  callerInfo = '';
  muted = false;
  held = false;
  showTransfer = false;
  transferDest = '';

  cfg: SipConfig = { user: '', password: '', domain: '', wsUri: '' };

  private subs: Subscription[] = [];

  constructor(public phone: SoftphoneService) {}

  ngOnInit() {
    // Browser WebRTC needs a secure context (HTTPS or localhost). On a bare-IP /
    // HTTP install getUserMedia + ws:// are blocked, so the in-app dialer can't
    // work — skip registration and show the external-softphone notice instead.
    if (!this.secureContext) {
      return;
    }

    const saved = this.phone.loadConfig();
    if (saved) {
      this.cfg = { ...saved };
      this.cfg.domain = this.phone.defaultDomain();
      this.phone.register(this.cfg);
    } else {
      this.cfg.domain = this.phone.defaultDomain();
      this.cfg.wsUri = this.phone.defaultWsUri();
    }

    this.subs.push(this.phone.registered$.subscribe(v => this.registered = v));
    this.subs.push(this.phone.callState$.subscribe(v => { this.callState = v; if (v === 'ringing') this.open = true; if (v === 'idle') { this.showTransfer = false; this.transferDest = ''; } }));
    this.subs.push(this.phone.callerInfo$.subscribe(v => this.callerInfo = v));
    this.subs.push(this.phone.muted$.subscribe(v => this.muted = v));
    this.subs.push(this.phone.held$.subscribe(v => this.held = v));
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  get secureContext(): boolean { return window.isSecureContext; }
  get serverHost(): string { return window.location.hostname; }

  toggle() { this.open = !this.open; }

  dial(d: string) {
    this.dialInput += d;
  }

  backspace() {
    this.dialInput = this.dialInput.slice(0, -1);
  }

  makeCall() {
    if (this.dialInput.trim()) {
      this.phone.call(this.dialInput.trim());
    }
  }

  pressDigit(d: string) {
    this.dial(d);
    if (this.callState === 'active') {
      this.phone.sendDTMF(d);
    }
  }

  saveSettings() {
    this.phone.saveConfig(this.cfg);
    this.phone.register(this.cfg);
    this.activeTab = 'dialer';
  }

  startTransfer() { this.showTransfer = true; this.transferDest = ''; }
  cancelTransfer() { this.showTransfer = false; this.transferDest = ''; }
  doTransfer() { if (this.transferDest.trim()) { this.phone.transfer(this.transferDest.trim()); this.showTransfer = false; } }

  disconnect() {
    this.phone.unregister();
    this.phone.clearConfig();
    this.cfg = { user: '', password: '', domain: this.phone.defaultDomain(), wsUri: this.phone.defaultWsUri() };
  }

  get statusClass(): string {
    if (this.callState === 'active') return 'status-active';
    if (this.callState === 'ringing') return 'status-ringing';
    if (this.callState === 'calling') return 'status-calling';
    if (this.registered) return 'status-registered';
    return 'status-offline';
  }

  get statusLabel(): string {
    if (this.callState === 'active') return 'On Call';
    if (this.callState === 'ringing') return 'Incoming...';
    if (this.callState === 'calling') return 'Calling...';
    if (this.registered) return 'Ready';
    return 'Offline';
  }
}
