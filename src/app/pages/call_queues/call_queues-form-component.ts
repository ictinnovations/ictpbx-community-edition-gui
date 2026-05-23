import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CallQueueService } from './call_queues.service';
import { CallQueue, CallQueueAgent } from './call_queues';
import { ExtensionCheckService } from '../../services/extension-check.service';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

@Component({
  selector: 'ngx-call-queues-form',
  templateUrl: './call_queues-form-component.html',
  styleUrls: ['./call_queues-form-component.scss'],
})
export class AddCallQueueComponent implements OnInit {

  queue: CallQueue = new CallQueue();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  extensionConflict: string | null = null;
  activeTab = 'settings';

  strategies = [
    'ring-all', 'longest-idle-agent', 'round-robin',
    'top-down', 'agent-with-least-talk-time',
    'agent-with-fewest-calls', 'sequentially-by-agent-order', 'random',
  ];

  agentTypes = ['callback', 'uuid-standby'];
  agentStatuses = ['Available', 'Available (On Demand)', 'On Break', 'Logged Out'];

  // Destination pickers
  extensions:   DestOption[] = [];
  timeoutType   = 'hangup';   // 'hangup' | 'transfer'
  timeoutTarget = '';          // selected extension number for transfer
  // Per-agent: selected extension number (drives agent_contact composition)
  agentExtension: string[] = [];

  constructor(
    private service: CallQueueService,
    private router: Router,
    private route: ActivatedRoute,
    private extCheck: ExtensionCheckService,
    private pbxDest: PbxDestinationService,
  ) {}

  checkExtension(value: string) {
    if (!value || this.isEdit) { this.extensionConflict = null; return; }
    this.extCheck.check(value).then(r => {
      this.extensionConflict = r.available ? null : `Already in use by ${r.used_by}`;
    });
  }

  ngOnInit() {
    this.pbxDest.getExtensions().then(exts => {
      this.extensions = exts;
    });

    const uuid = this.route.snapshot.paramMap.get('id');
    if (!uuid) {
      this.extCheck.nextAvailable().then(n => { if (n) this.queue.queue_extension = n; });
    }
    if (uuid) {
      this.isEdit = true;
      this.service.get_CallQueueData(uuid).then(data => {
        this.queue = data;
        if (!this.queue.agents) this.queue.agents = [];
        this.parseTimeoutAction(this.queue.queue_timeout_action);
        this.agentExtension = this.queue.agents.map(a => this.parseAgentExt(a.agent_contact));
      });
    }
  }

  private parseTimeoutAction(val: string) {
    if (!val || val.startsWith('hangup')) {
      this.timeoutType = 'hangup';
      this.timeoutTarget = '';
    } else if (val.startsWith('transfer:')) {
      this.timeoutType = 'transfer';
      this.timeoutTarget = val.replace('transfer:', '');
    }
  }

  private parseAgentExt(contact: string): string {
    // "user/1001@domain" → "1001"
    const m = contact && contact.match(/user\/([^@]+)@/);
    return m ? m[1] : '';
  }

  onTimeoutTypeChange() {
    this.timeoutTarget = '';
    this.composeTimeoutAction();
  }

  onTimeoutTargetChange() {
    this.composeTimeoutAction();
  }

  private composeTimeoutAction() {
    this.queue.queue_timeout_action = this.timeoutType === 'transfer' && this.timeoutTarget
      ? `transfer:${this.timeoutTarget}`
      : 'hangup:';
  }

  onAgentExtChange(i: number) {
    const ext = this.agentExtension[i] || '';
    const domain = this.extensions.length > 0
      ? (this.extensions.find(e => e.extension === ext) as any)?.user_context || 'default'
      : 'default';
    this.queue.agents[i].agent_contact = ext ? `user/${ext}@${domain}` : '';
  }

  addAgent() {
    const agent = new CallQueueAgent();
    agent.agent_name = '';
    agent.agent_type = 'callback';
    agent.agent_call_timeout = 20;
    agent.agent_contact = '';
    agent.agent_status = 'Available';
    this.queue.agents.push(agent);
    this.agentExtension.push('');
  }

  removeAgent(index: number) {
    this.queue.agents.splice(index, 1);
    this.agentExtension.splice(index, 1);
  }

  save() {
    this.errorText = [];
    if (!this.queue.queue_name) { this.errorText.push('Name is required'); }
    if (!this.queue.queue_extension) { this.errorText.push('Extension is required'); }
    if (this.extensionConflict) { this.errorText.push(this.extensionConflict); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update_CallQueue(this.queue)
      : this.service.add_CallQueue(this.queue);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/call_queues/call_queues']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
