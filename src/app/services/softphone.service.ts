import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as JsSIP from 'jssip';

export type CallState = 'idle' | 'calling' | 'ringing' | 'active';

export interface SipConfig {
  user: string;
  password: string;
  domain: string;
  wsUri: string;
}

@Injectable({ providedIn: 'root' })
export class SoftphoneService {

  registered$ = new BehaviorSubject<boolean>(false);
  callState$  = new BehaviorSubject<CallState>('idle');
  callerInfo$ = new BehaviorSubject<string>('');
  muted$      = new BehaviorSubject<boolean>(false);
  held$       = new BehaviorSubject<boolean>(false);

  private ua: any = null;
  private session: any = null;
  private remoteAudio: HTMLAudioElement | null = null;
  config: SipConfig | null = null;

  // ── Config persistence ────────────────────────────────────────────────────

  saveConfig(cfg: SipConfig) {
    localStorage.setItem('sip_config', JSON.stringify(cfg));
    this.config = cfg;
  }

  loadConfig(): SipConfig | null {
    const raw = localStorage.getItem('sip_config');
    if (!raw) return null;
    try { this.config = JSON.parse(raw); return this.config; } catch { return null; }
  }

  clearConfig() {
    localStorage.removeItem('sip_config');
    this.config = null;
  }

  defaultWsUri(): string {
    const host = window.location.hostname;
    if (window.location.protocol === 'https:') {
      return `wss://${host}/ws/`;
    }
    return `ws://${host}/ws/`;
  }

  // ── UA lifecycle ──────────────────────────────────────────────────────────

  register(cfg: SipConfig) {
    this.unregister();
    if (window.location.protocol === 'https:' && cfg.wsUri.startsWith('ws://')) {
      cfg.wsUri = cfg.wsUri.replace('ws://', 'wss://');
    }
    this.config = cfg;

    const socket = new JsSIP.WebSocketInterface(cfg.wsUri);
    this.ua = new JsSIP.UA({
      sockets:    [socket],
      uri:        `sip:${cfg.user}@${cfg.domain}`,
      password:   cfg.password,
      display_name: cfg.user,
      register:   true,
    });

    this.ua.on('registered',   () => this.registered$.next(true));
    this.ua.on('unregistered', () => this.registered$.next(false));
    this.ua.on('registrationFailed', () => this.registered$.next(false));

    this.ua.on('newRTCSession', (data: any) => {
      const s = data.session;
      if (data.originator === 'remote') {
        this.session = s;
        this.callerInfo$.next(s.remote_identity?.uri?.user || 'Unknown');
        this.callState$.next('ringing');
        s.on('ended',  () => this.onSessionEnd());
        s.on('failed', () => this.onSessionEnd());
      }
    });

    this.ua.start();
  }

  unregister() {
    if (this.ua) {
      try { this.ua.stop(); } catch {}
      this.ua = null;
    }
    this.registered$.next(false);
    this.callState$.next('idle');
  }

  // ── Call control ──────────────────────────────────────────────────────────

  call(target: string) {
    if (!this.ua || !this.config) return;
    const dest = target.includes('@') ? target : `sip:${target}@${this.config.domain}`;
    this.callState$.next('calling');
    this.callerInfo$.next(target);

    const s = this.ua.call(dest, {
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });
    this.session = s;

    s.on('progress', () => this.callState$.next('calling'));
    s.on('confirmed', (data: any) => {
      this.callState$.next('active');
      this.attachRemoteAudio(data.ack?.connection || s.connection);
    });
    s.on('ended',  () => this.onSessionEnd());
    s.on('failed', (data: any) => { console.error('[JsSIP] call failed:', data?.cause, data?.message || ''); this.onSessionEnd(); });

    // Also catch confirmed via peerconnection
    s.on('peerconnection', (data: any) => {
      data.peerconnection.ontrack = (ev: RTCTrackEvent) => {
        this.playRemoteStream(ev.streams[0]);
      };
    });
  }

  answer() {
    if (!this.session) return;
    this.session.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });
    this.session.on('peerconnection', (data: any) => {
      data.peerconnection.ontrack = (ev: RTCTrackEvent) => {
        this.playRemoteStream(ev.streams[0]);
      };
    });
    this.callState$.next('active');
  }

  hangup() {
    if (!this.session) return;
    try {
      if (this.callState$.value === 'ringing') this.session.terminate();
      else this.session.terminate();
    } catch {}
    this.onSessionEnd();
  }

  reject() {
    if (!this.session) return;
    try { this.session.terminate({ status_code: 486 }); } catch {}
    this.onSessionEnd();
  }

  toggleMute() {
    if (!this.session) return;
    if (this.muted$.value) { this.session.unmute({ audio: true }); this.muted$.next(false); }
    else                   { this.session.mute({ audio: true });   this.muted$.next(true);  }
  }

  toggleHold() {
    if (!this.session) return;
    if (this.held$.value) {
      this.session.unhold();
      this.held$.next(false);
    } else {
      this.session.hold();
      this.held$.next(true);
    }
  }

  transfer(destination: string) {
    if (!this.session || !this.config) return;
    const target = destination.includes('@')
      ? `sip:${destination}`
      : `sip:${destination}@${this.config.domain}`;
    try { this.session.refer(target); } catch {}
    this.onSessionEnd();
  }

  sendDTMF(digit: string) {
    if (!this.session) return;
    try { this.session.sendDTMF(digit); } catch {}
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private playRemoteStream(stream: MediaStream) {
    if (!this.remoteAudio) {
      this.remoteAudio = new Audio();
    }
    this.remoteAudio.srcObject = stream;
    this.remoteAudio.play().catch(() => {});
  }

  private attachRemoteAudio(conn: RTCPeerConnection) {
    if (!conn) return;
    conn.ontrack = (ev: RTCTrackEvent) => {
      this.playRemoteStream(ev.streams[0]);
    };
  }

  private onSessionEnd() {
    this.session = null;
    this.callState$.next('idle');
    this.callerInfo$.next('');
    this.muted$.next(false);
    this.held$.next(false);
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
      this.remoteAudio = null;
    }
  }
}
