import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {
  Invitation,
  Inviter,
  InviterOptions,
  Registerer,
  Session,
  SessionState,
  UserAgent,
  UserAgentOptions,
  InvitationAcceptOptions,
  Web,
  SessionInviteOptions,
  RequestPendingError
} from 'sip.js';
import { AgentDashboardService } from './agent-dashboard.service';
import { AgentDashboard } from './agent-dashboard';
import { NbMenuService, NbToastrService } from '@nebular/theme';
import { ContactService } from '../contact/contact.service';
import { CampaignService } from '../campaigns/campaign.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ContactDataSource } from '../contact/contact-datasource.component';
import { ContactDatabase } from '../contact/contact-database.component';
import { ExtensionService } from '../extension/extension.service';

@Component({
  selector: 'app-agent-dashboard',
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.scss'],
})
export class AgentDashboardComponent implements OnInit, OnDestroy {

  constructor(
    private agent_service: AgentDashboardService,
    private contact_service: ContactService,
    private campaign_service: CampaignService,
    private menuService: NbMenuService,
    private toastrService: NbToastrService,
    private extension_service: ExtensionService
  ) {
    this.menuService.onItemClick()
      .subscribe(({ item }) => {
        if (item.title === 'Agent Contacts') {
          this.selectedMenu = 'contacts';
        }
        if (item.title === 'Contact Disposition') {
          this.selectedMenu = 'desposition_contacts';
        }
      });
  }

  agent_status: any;
  target: any;
  inputValue = '';
  numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  incomingCall = false;
  ongoingCall = false;
  dialingCall = false;
  outgoingCall = false;
  callerDisplay = '';
  callState = 'idle';
  desp_contact: any = {};
  selectedMenu = 'contacts';
  campaigns: any;
  selected_camp: any = '';
  campaign: any = 1;
  isMuted: boolean;
  istransfer: boolean = false;
  extensions: any;
  istarget: boolean = false;
  onhold: boolean = false;

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  displayedColumns = ['ID', 'firstName', 'lastName', 'Phone', 'Operations'];
  aContact: ContactDataSource | null;
  length: any;
  contact_id: any;

  agent: AgentDashboard = new AgentDashboard();
  agent_id: any = localStorage.getItem('agent_id');

  private userAgent!: UserAgent;
  private registerer!: Registerer;
  private incomingSession: Invitation | null = null;
  private outgoingSession: Inviter | null = null;
  private remoteAudio = new Audio();
  private ringtoneAudio = new Audio('assets/sounds/ringtone.mp3');
  private dialtoneAudio = new Audio('assets/sounds/dialtone.mp3');

  async ngOnInit() {
    this.agent = await this.agent_service.get_provisioning(this.agent_id);
    this.getCampaignlist();
    await this.initializeSipAgent();
  }

  getCampaignlist() {
    const agent_id = this.agent_id;
    this.campaign_service.get_CampaignList().then(data => {
      const campaigns = Array.isArray(data) ? data : [];
      this.campaigns = campaigns.filter(campaign => {
        let assign_to = campaign.assign_to;
        if (typeof assign_to === 'string') {
          try { assign_to = JSON.parse(assign_to); } catch (e) { assign_to = []; }
        }
        return Array.isArray(assign_to) && assign_to.includes(agent_id);
      });
    });
  }

  ngOnDestroy() {
    if (this.registerer) this.registerer.unregister();
    if (this.userAgent) this.userAgent.stop();
  }

  get_contactdesposition() {
    this.contact_service.get_contactdesposition(this.contact_id).then(data => {
      this.desp_contact = data;
    });
  }

  campaign_contacts(event: any) {
    const campaign_id = event;
    this.campaign_service.get_campaigncontacts(campaign_id).then(data => {
      this.length = data.length;
      this.aContact = new ContactDataSource(new ContactDatabase(data), this.sort, this.paginator);
    });
  }

  private async initializeSipAgent() {
    const uri = UserAgent.makeURI(`sip:${this.agent.username}@agent.ictfax.com`);
    if (!uri) throw new Error('Invalid SIP URI');

    const userAgentOptions: UserAgentOptions = {
      uri,
      authorizationUsername: this.agent.username,
      authorizationPassword: this.agent.password,
      displayName: this.agent.username,
      transportOptions: {
        server: `wss://agent.ictfax.com:7443`,
      },
    };

    this.userAgent = new UserAgent(userAgentOptions);
    this.userAgent.delegate = {
      onInvite: (invitation: Invitation) => this.onIncomingCall(invitation),
    };

    this.registerer = new Registerer(this.userAgent);
    await this.userAgent.start();
    await this.registerer.register();
  }

  private onIncomingCall(invitation: Invitation) {
    this.incomingCall = true;
    this.callerDisplay = invitation.remoteIdentity.displayName || invitation.remoteIdentity.uri.user;
    this.incomingSession = invitation;
    this.showToast();
    this.playRingtone();
    invitation.stateChange.addListener((state) => {
      if (state === SessionState.Terminated) { this.resetCallState(); }
    });
  }

  agent_availabitly($event: any) {
    this.agent_available($event);
  }

  agent_available(value) {
    if (value == 1) {
      this.target = UserAgent.makeURI(`sip:*${this.agent.callerid}@agent.ictfax.com`);
    } else {
      this.target = UserAgent.makeURI(`sip:**${this.agent.callerid}@agent.ictfax.com`);
    }
    const inviterOptions: InviterOptions = {
      sessionDescriptionHandlerOptions: { constraints: { audio: true } },
    };
    const inviter = new Inviter(this.userAgent, this.target, inviterOptions);
    inviter.invite();
  }

  answerCall() {
    if (!this.incomingSession) return;
    this.stopRingtone();
    const options: InvitationAcceptOptions = {
      sessionDescriptionHandlerOptions: { constraints: { audio: true } },
    };
    this.incomingSession.accept(options).then(() => {
      const sdh: any = this.incomingSession?.sessionDescriptionHandler;
      if (sdh?.remoteMediaStream) this.remoteAudio.srcObject = sdh.remoteMediaStream;
      this.remoteAudio.autoplay = true;
      this.ongoingCall = true;
      this.incomingCall = false;
      this.callState = 'in-call';
    });
  }

  saveDisposition() {
    this.desp_contact.agent_id = this.agent_id;
    this.contact_service.update_disposition(this.desp_contact).then(() => {
      this.toastrService.success('Contact Disposition Saved Successfully', 'Success');
    });
  }

  rejectCall() {
    this.stopRingtone();
    if (this.incomingSession) {
      this.incomingSession.reject();
      this.resetCallState();
    }
  }

  async makeCall() {
    this.outgoingCall = true;
    const targetUri = UserAgent.makeURI(`sip:${this.inputValue}@agent.ictfax.com`);
    if (!targetUri) return alert('Invalid number');

    const inviterOptions: InviterOptions = {
      sessionDescriptionHandlerOptions: { constraints: { audio: true } },
    };
    this.outgoingSession = new Inviter(this.userAgent, targetUri, inviterOptions);

    this.outgoingSession.stateChange.addListener((state) => {
      switch (state) {
        case SessionState.Establishing:
          this.dialtoneAudio.currentTime = 0;
          this.dialtoneAudio.play();
          this.callState = 'dialing';
          this.dialingCall = true;
          break;
        case SessionState.Established:
          this.dialtoneAudio.pause();
          this.dialtoneAudio.currentTime = 0;
          this.dialingCall = false;
          this.callState = 'in-call';
          this.ongoingCall = true;
          const sdh: any = this.outgoingSession?.sessionDescriptionHandler;
          if (sdh?.remoteMediaStream) this.remoteAudio.srcObject = sdh.remoteMediaStream;
          this.remoteAudio.autoplay = true;
          break;
        case SessionState.Terminated:
          this.dialtoneAudio.pause();
          this.dialtoneAudio.currentTime = 0;
          this.resetCallState();
          break;
      }
    });

    await this.outgoingSession.invite();
  }

  hangupCall() {
    this.dialtoneAudio.pause();
    this.dialtoneAudio.currentTime = 0;
    if (this.contact_id) {
      this.selectedMenu = 'desposition_contacts';
      this.get_contactdesposition();
    }
    if (this.incomingSession && this.incomingSession.state !== SessionState.Terminated) {
      this.incomingSession.bye?.();
    }
    if (this.outgoingSession && this.outgoingSession.state !== SessionState.Terminated) {
      this.outgoingSession.bye?.();
    }
    this.resetCallState();
  }

  private resetCallState() {
    this.incomingCall = false;
    this.ongoingCall = false;
    this.outgoingCall = false;
    this.dialingCall = false;
    this.callState = 'idle';
    this.incomingSession = null;
    this.outgoingSession = null;
    this.remoteAudio.srcObject = null;
    this.contact_id = null;
  }

  contactCall(number, id) {
    this.inputValue = number;
    this.contact_id = id;
    this.makeCall();
  }

  showToast() {
    this.toastrService.success(`from ${this.callerDisplay}`, `Incomming Call`, { duration: 0 });
  }

  appendNumber(n: string) { this.inputValue += n; }
  clearInput() { this.inputValue = ''; }
  deleteLast() { this.inputValue = this.inputValue.slice(0, -1); }

  playRingtone() {
    try {
      this.ringtoneAudio.currentTime = 0;
      this.ringtoneAudio.play().catch(err => console.warn('Autoplay blocked:', err));
    } catch (e) { console.error('Failed to play ringtone:', e); }
  }

  stopRingtone() {
    try {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
    } catch (e) { console.error('Failed to stop ringtone:', e); }
  }

  isCallmute(isMuted) {
    const session = (this.incomingSession as any) || (this.outgoingSession as any) || null;
    const pc = session.sessionDescriptionHandler?.peerConnection;
    this.isMuted = isMuted;
    if (this.isMuted === false) {
      pc.getSenders().forEach((sender: RTCRtpSender) => {
        if (sender.track && sender.track.kind === 'audio') { sender.track.enabled = true; }
      });
      this.toastrService.success('Microphone Unmuted');
    } else {
      pc.getSenders().forEach((sender: RTCRtpSender) => {
        if (sender.track && sender.track.kind === 'audio') { sender.track.enabled = false; }
      });
      this.toastrService.info('Microphone Muted');
    }
  }

  transfering(istransfer) {
    this.istransfer = istransfer;
    this.extension_service.get_ExtensionList().then(data => { this.extensions = data; });
  }

  targetext(value) {
    this.inputValue = value;
    this.istarget = true;
  }

  blindtransfer() {
    const targetUri = UserAgent.makeURI(`sip:${this.inputValue}@agent.ictfax.com`);
    this.incomingSession.refer(targetUri);
    this.istransfer = false;
    this.istarget = false;
    this.inputValue = '';
  }

  attendedtransfer() {
    console.log('Attended transfer DTMF (3) sent via SIP INFO');
    this.inputValue = '';
  }

  holdcall() {
    const sessionDescriptionHandlerOptions: Web.SessionDescriptionHandlerOptions = { hold: true };
    this.outgoingSession.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;
    const options: SessionInviteOptions = {
      requestDelegate: { onAccept: (): void => { }, onReject: (): void => { } }
    };
    this.outgoingSession.invite(options).catch((error: Error) => {
      if (error instanceof RequestPendingError) { }
    });
    this.onhold = true;
    this.toastrService.info('Call Onhold');
  }

  unholdcall() {
    const sessionDescriptionHandlerOptions: Web.SessionDescriptionHandlerOptions = { hold: false };
    this.outgoingSession.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;
    const options: SessionInviteOptions = {
      requestDelegate: { onAccept: (): void => { }, onReject: (): void => { } }
    };
    this.outgoingSession.invite(options).catch((error: Error) => {
      if (error instanceof RequestPendingError) { }
    });
    this.onhold = false;
    this.toastrService.success('Call Unhold');
  }
}
