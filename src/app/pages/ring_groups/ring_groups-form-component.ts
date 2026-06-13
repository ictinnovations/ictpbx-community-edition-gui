import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RingGroupService } from './ring_groups.service';
import { RingGroup, RingGroupDestination } from './ring_groups';
import { ExtensionCheckService } from '../../services/extension-check.service';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

@Component({
  selector: 'ngx-ring-groups-form',
  templateUrl: './ring_groups-form-component.html',
  styleUrls: ['./ring_groups-form-component.scss'],
})
export class AddRingGroupComponent implements OnInit {

  ringGroup: RingGroup = new RingGroup();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  extensionConflict: string | null = null;

  strategies = ['simultaneous', 'sequence', 'random', 'rollover', 'enterprise', 'enterprise-2'];

  // Destination picker data
  extensions:  DestOption[] = [];
  ringGroups:  DestOption[] = [];
  ivrMenus:    DestOption[] = [];
  voicemails:  DestOption[] = [];
  timeoutDestType = 'extension';
  // Per-member external toggle (index → boolean)
  destIsExternal: boolean[] = [];

  constructor(
    private service: RingGroupService,
    private router: Router,
    private route: ActivatedRoute,
    private extCheck: ExtensionCheckService,
    private pbxDest: PbxDestinationService,
  ) {
    this.ringGroup.ring_group_strategy = 'simultaneous';
    this.ringGroup.ring_group_call_timeout = 30;
    this.ringGroup.ring_group_enabled = true;
    this.ringGroup.destinations = [];
  }

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
    });

    const uuid = this.route.snapshot.paramMap.get('id');
    if (!uuid) {
      this.extCheck.nextAvailable().then(n => { if (n) this.ringGroup.ring_group_extension = n; });
    }
    if (uuid) {
      this.isEdit = true;
      this.service.get_RingGroupData(uuid).then(data => {
        this.ringGroup = data;
        if (!this.ringGroup.destinations) this.ringGroup.destinations = [];
        this.destIsExternal = this.ringGroup.destinations.map(() => false);
        this.timeoutDestType = this.detectTimeoutType(this.ringGroup.ring_group_timeout_data);
      });
    }
  }

  get timeoutDestList(): DestOption[] {
    switch (this.timeoutDestType) {
      case 'ring_group': return this.ringGroups;
      case 'ivr':        return this.ivrMenus;
      case 'voicemail':  return this.voicemails;
      default:           return this.extensions;
    }
  }

  onTimeoutTypeChange() {
    this.ringGroup.ring_group_timeout_data = '';
  }

  private detectTimeoutType(val: string): string {
    if (!val) return 'extension';
    if (this.ringGroups.some(r => r.extension === val)) return 'ring_group';
    if (this.ivrMenus.some(r => r.extension === val))   return 'ivr';
    if (this.voicemails.some(r => r.extension === val)) return 'voicemail';
    return 'extension';
  }

  isExternalDest(i: number): boolean {
    return !!this.destIsExternal[i];
  }

  toggleExternal(i: number) {
    this.destIsExternal[i] = !this.destIsExternal[i];
    this.ringGroup.destinations[i].destination_number = '';
  }

  addDestination() {
    const dest = new RingGroupDestination();
    dest.destination_number = '';
    dest.destination_delay = 0;
    dest.destination_timeout = 30;
    dest.destination_order = this.ringGroup.destinations.length + 1;
    dest.destination_enabled = true;
    this.ringGroup.destinations.push(dest);
    this.destIsExternal.push(false);
  }

  removeDestination(index: number) {
    this.ringGroup.destinations.splice(index, 1);
    this.destIsExternal.splice(index, 1);
  }

  save() {
    this.errorText = [];
    if (!this.ringGroup.ring_group_name) { this.errorText.push('Name is required'); }
    if (!this.ringGroup.ring_group_extension) { this.errorText.push('Extension is required'); }
    if (this.extensionConflict) { this.errorText.push(this.extensionConflict); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update_RingGroup(this.ringGroup)
      : this.service.add_RingGroup(this.ringGroup);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['../'], { relativeTo: this.route }), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
