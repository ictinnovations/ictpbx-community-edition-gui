import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CallFlowService } from './call_flow.service';
import { CallFlow } from './call_flow';
import { ExtensionCheckService } from '../../services/extension-check.service';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

@Component({
  selector: 'ngx-call-flows-form',
  templateUrl: './call_flows-form.component.html',
})
export class CallFlowsFormComponent implements OnInit {

  item: CallFlow = new CallFlow();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  extensionConflict: string | null = null;

  extensions: DestOption[] = [];
  ringGroups: DestOption[] = [];
  ivrMenus:   DestOption[] = [];
  voicemails: DestOption[] = [];

  openDestType  = 'extension';
  nightDestType = 'extension';

  constructor(
    private service: CallFlowService,
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
    Promise.all([
      this.pbxDest.getExtensions(),
      this.pbxDest.getRingGroups(),
      this.pbxDest.getIvrMenus(),
      this.pbxDest.getVoicemails(),
    ]).then(([exts, rgs, ivrs, vms]) => {
      this.extensions = exts;
      this.ringGroups = rgs;
      this.ivrMenus   = ivrs;
      this.voicemails = vms;
      if (this.isEdit) {
        this.openDestType  = this.detectDestType(this.item.call_flow_data);
        this.nightDestType = this.detectDestType(this.item.call_flow_alternate_data);
      }
    });

    const uuid = this.route.snapshot.paramMap.get('id');
    if (!uuid) {
      this.extCheck.nextAvailable().then(n => { if (n) this.item.call_flow_extension = n; });
    }
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.item = data;
        this.item.call_flow_enabled = (data.call_flow_enabled as any) === 'true' || data.call_flow_enabled === true;
        this.openDestType  = this.detectDestType(this.item.call_flow_data);
        this.nightDestType = this.detectDestType(this.item.call_flow_alternate_data);
      });
    }
  }

  private detectDestType(val: string): string {
    if (!val) return 'extension';
    // Destinations are stored as the routing number; records written before that
    // change hold the uuid, so both are matched.
    if (this.pbxDest.isVoicemailDial(val)) return 'voicemail';
    if (this.ringGroups.some(r => r.uuid === val || r.extension === val)) return 'ring_group';
    if (this.ivrMenus.some(r => r.uuid === val || r.extension === val))   return 'ivr';
    if (this.voicemails.some(r => r.uuid === val)) return 'voicemail';
    return 'extension';
  }

  destList(type: string): DestOption[] {
    switch (type) {
      case 'ring_group': return this.ringGroups;
      case 'ivr':        return this.ivrMenus;
      case 'voicemail':  return this.voicemails;
      default:           return this.extensions;
    }
  }

  /**
   * Every destination is stored as the number that routes it. The generated dialplan
   * emits this value straight into `transfer <value> XML ictcore`, so a uuid — which is
   * what ring group and IVR targets used to store — could never be dialled.
   */
  destValue(type: string, opt: DestOption): string {
    return this.pbxDest.dialValue(type, opt);
  }

  onOpenTypeChange()  { this.item.call_flow_data           = ''; }
  onNightTypeChange() { this.item.call_flow_alternate_data = ''; }

  save() {
    this.errorText = [];
    if (!this.item.call_flow_name) { this.errorText.push('Name is required'); }
    if (!this.item.call_flow_extension) { this.errorText.push('Extension is required'); }
    if (this.extensionConflict) { this.errorText.push(this.extensionConflict); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const payload = { ...this.item, call_flow_enabled: this.item.call_flow_enabled ? 'true' : 'false' };
    const action = this.isEdit ? this.service.update(payload as any) : this.service.add(payload as any);
    action.then(() => {
      this.isSuccess = true; this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/call_flows/call_flows']), 1000);
    }).catch(err => { this.isError = true; this.errorText = [err.message || 'Save failed']; });
  }
}
