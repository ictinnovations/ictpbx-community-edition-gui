import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeConditionService } from './time_condition.service';
import { TimeCondition } from './time_condition';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';
import { ExtensionCheckService } from '../../services/extension-check.service';

@Component({
  selector: 'ngx-time-conditions-form',
  templateUrl: './time_conditions-form.component.html',
})
export class TimeConditionsFormComponent implements OnInit {

  item: TimeCondition = new TimeCondition();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];

  // Destination pickers
  extensions: DestOption[] = [];
  ringGroups: DestOption[] = [];
  ivrMenus:   DestOption[] = [];
  voicemails: DestOption[] = [];

  openDestType   = 'extension';
  closedDestType = 'extension';

  constructor(
    private service: TimeConditionService,
    private router: Router,
    private route: ActivatedRoute,
    private pbxDest: PbxDestinationService,
    private extCheck: ExtensionCheckService,
  ) {}

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

      // Detect types for saved values when editing
      if (this.isEdit) {
        this.openDestType   = this.detectDestType(this.item.tc_open_destination);
        this.closedDestType = this.detectDestType(this.item.tc_closed_destination);
      }
    });

    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.item = data;
        this.item.tc_enabled = (data.tc_enabled as any) === 'true' || data.tc_enabled === true;
        this.openDestType   = this.detectDestType(this.item.tc_open_destination);
        this.closedDestType = this.detectDestType(this.item.tc_closed_destination);
      });
    } else {
      // Auto-assign a unique internal extension number for new time conditions
      this.extCheck.nextAvailable().then(n => { if (n) this.item.tc_extension = n; });
    }
  }

  private detectDestType(val: string): string {
    if (!val) return 'extension';
    // The *99 prefix is checked first and on its own: a mailbox may share a number with
    // an extension, so matching on the bare id would read extension 1001 as mailbox 1001.
    if (this.pbxDest.isVoicemailDial(val)) return 'voicemail';
    if (this.ringGroups.some(r => r.uuid === val || r.extension === val)) return 'ring_group';
    if (this.ivrMenus.some(r => r.uuid === val || r.extension === val))   return 'ivr';
    if (this.voicemails.some(r => r.uuid === val)) return 'voicemail';
    return 'extension';
  }

  /**
   * Every destination is stored as the number that routes it. The generated dialplan
   * emits this value straight into `transfer <value> XML ictcore`, so a uuid — which is
   * what ring group and IVR targets used to store — could never be dialled.
   */
  destValue(type: string, opt: DestOption): string {
    return this.pbxDest.dialValue(type, opt);
  }

  destList(type: string): DestOption[] {
    switch (type) {
      case 'ring_group': return this.ringGroups;
      case 'ivr':        return this.ivrMenus;
      case 'voicemail':  return this.voicemails;
      default:           return this.extensions;
    }
  }

  onOpenTypeChange()   { this.item.tc_open_destination   = ''; }
  onClosedTypeChange() { this.item.tc_closed_destination = ''; }

  save() {
    this.errorText = [];
    if (!this.item.tc_name) { this.errorText.push('Name is required'); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const payload = { ...this.item, tc_enabled: this.item.tc_enabled ? 'true' : 'false' };
    const action = this.isEdit ? this.service.update(payload as any) : this.service.add(payload as any);
    action.then(() => {
      this.isSuccess = true; this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/time_conditions/time_conditions']), 1000);
    }).catch(err => { this.isError = true; this.errorText = [err.message || 'Save failed']; });
  }
}
