import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InboundRouteService } from './inbound_route.service';
import { InboundRoute } from './inbound_route';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

@Component({
  selector: 'ngx-inbound-route-form',
  templateUrl: './inbound_route-form.component.html',
  styleUrls: ['./inbound_route-form.component.scss'],
})
export class InboundRouteFormComponent implements OnInit {

  route: InboundRoute = new InboundRoute();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];

  targetTypes = [
    { value: 'extension',   label: 'Extension' },
    { value: 'ring_group',  label: 'Ring Group' },
    { value: 'ivr',         label: 'IVR Menu' },
    { value: 'voicemail',   label: 'Voicemail' },
  ];

  extensions: DestOption[] = [];
  ringGroups: DestOption[] = [];
  ivrMenus:   DestOption[] = [];
  voicemails: DestOption[] = [];

  constructor(
    private service: InboundRouteService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private pbxDest: PbxDestinationService,
  ) {}

  get targetList(): DestOption[] {
    switch (this.route.destination_target_type) {
      case 'ring_group': return this.ringGroups;
      case 'ivr':        return this.ivrMenus;
      case 'voicemail':  return this.voicemails;
      default:           return this.extensions;
    }
  }

  onTargetTypeChange() {
    this.route.destination_target = '';
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

    const uuid = this.activatedRoute.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.route = data;
        this.route.destination_enabled = (data.destination_enabled as any) === 'true' || (data.destination_enabled as any) === true;
      });
    }
  }

  save() {
    this.errorText = [];
    if (!this.route.destination_number) this.errorText.push('DID Number is required');
    if (!this.route.destination_target) this.errorText.push('Destination target is required');
    if (this.errorText.length) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update(this.route)
      : this.service.create(this.route);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/inbound_routes/inbound_routes']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
