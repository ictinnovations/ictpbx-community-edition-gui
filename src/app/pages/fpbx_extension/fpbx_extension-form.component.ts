import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FpbxExtensionService } from './fpbx_extension.service';
import { FpbxExtension } from './fpbx_extension';
import { ExtensionCheckService } from '../../services/extension-check.service';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';
import { FollowMeService } from '../follow_me/follow_me.service';
import { FollowMe, FollowMeDestination } from '../follow_me/follow_me';

@Component({
  selector: 'ngx-fpbx-extension-form',
  templateUrl: './fpbx_extension-form.component.html',
  styleUrls: ['./fpbx_extension-form.component.scss'],
})
export class FpbxExtensionFormComponent implements OnInit {

  ext: FpbxExtension = new FpbxExtension();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  extensionConflict: string | null = null;

  recordOptions = ['none', 'local', 'inbound', 'outbound', 'all'];

  // Extension pickers for forwarding
  extensions: DestOption[] = [];
  _extMode_fwd_all      = false;
  _extMode_fwd_busy     = false;
  _extMode_fwd_no_answer = false;
  _extMode_fwd_unreg    = false;

  // User assignment
  tenantUsers: any[] = [];
  linked_user_id: any = '';
  showUserAssign = localStorage.getItem('is_tenant') === '1' || localStorage.getItem('is_admin') === '1';

  // Follow Me (embedded tab)
  followMe: FollowMe = new FollowMe();
  fmIsEdit = false;
  fmDestIsExternal: boolean[] = [];

  constructor(
    private service: FpbxExtensionService,
    private router: Router,
    private route: ActivatedRoute,
    private extCheck: ExtensionCheckService,
    private pbxDest: PbxDestinationService,
    private followMeService: FollowMeService,
  ) {}

  checkExtension(value: string) {
    if (!value || this.isEdit) { this.extensionConflict = null; return; }
    this.extCheck.check(value).then(r => {
      this.extensionConflict = r.available ? null : `Already in use by ${r.used_by}`;
    });
  }

  private isExternalVal(val: string | null): boolean {
    if (!val) return false;
    return !this.extensions.some(e => e.extension === val);
  }

  onFwdChange(field: string, val: string) {
    if (val !== '__external__') return;
    (this.ext as any)[field] = '';
    if (field === 'forward_all_destination')                  this._extMode_fwd_all       = true;
    else if (field === 'forward_busy_destination')            this._extMode_fwd_busy      = true;
    else if (field === 'forward_no_answer_destination')       this._extMode_fwd_no_answer = true;
    else if (field === 'forward_user_not_registered_destination') this._extMode_fwd_unreg = true;
  }

  ngOnInit() {
    const extLoad = this.pbxDest.getExtensions().then(e => { this.extensions = e; });

    const isTenant = localStorage.getItem('is_tenant') === '1';
    const isAdmin  = localStorage.getItem('is_admin')  === '1';
    if (isTenant || isAdmin) {
      this.service.getUsers()
        .then(users => this.tenantUsers = users || [])
        .catch(() => { /* non-fatal — dropdown stays hidden */ });
    }

    const uuid = this.route.snapshot.paramMap.get('id');
    if (!uuid) {
      this.extCheck.nextAvailable().then(n => { if (n) this.ext.extension = n; });
      return;
    }

    this.isEdit = true;
    Promise.all([extLoad, this.service.getData(uuid)]).then(([, data]) => {
      this.ext = data;
      this.ext.enabled                              = (data.enabled as any) === 'true' || (data.enabled as any) === true;
      this.ext.directory_visible                    = (data.directory_visible as any) === 'true' || (data.directory_visible as any) === true;
      this.ext.directory_exten_visible              = (data.directory_exten_visible as any) === 'true' || (data.directory_exten_visible as any) === true;
      this.ext.do_not_disturb                       = (data.do_not_disturb as any) === 'true' || (data.do_not_disturb as any) === true;
      this.ext.follow_me_enabled                    = (data.follow_me_enabled as any) === 'true' || (data.follow_me_enabled as any) === true;
      this.ext.forward_all_enabled                  = (data.forward_all_enabled as any) === 'true' || (data.forward_all_enabled as any) === true;
      this.ext.forward_busy_enabled                 = (data.forward_busy_enabled as any) === 'true' || (data.forward_busy_enabled as any) === true;
      this.ext.forward_no_answer_enabled            = (data.forward_no_answer_enabled as any) === 'true' || (data.forward_no_answer_enabled as any) === true;
      this.ext.forward_user_not_registered_enabled  = (data.forward_user_not_registered_enabled as any) === 'true' || (data.forward_user_not_registered_enabled as any) === true;
      const lid = (data as any).linked_user_id;
      this.linked_user_id = lid != null ? String(lid) : '';
      this._extMode_fwd_all       = this.isExternalVal(this.ext.forward_all_destination);
      this._extMode_fwd_busy      = this.isExternalVal(this.ext.forward_busy_destination);
      this._extMode_fwd_no_answer = this.isExternalVal(this.ext.forward_no_answer_destination);
      this._extMode_fwd_unreg     = this.isExternalVal(this.ext.forward_user_not_registered_destination);

      this.followMe.extension_uuid = uuid;
      this.followMeService.getList().then(list => {
        const fm = (list || []).find(f => f.extension_uuid === uuid);
        if (fm && fm.follow_me_uuid) {
          this.fmIsEdit = true;
          this.followMeService.getData(fm.follow_me_uuid).then(full => {
            this.followMe = full;
            this.followMe.follow_me_enabled      = (full.follow_me_enabled as any) === 'true' || full.follow_me_enabled === true;
            this.followMe.follow_me_ignore_busy  = (full.follow_me_ignore_busy as any) === 'true' || full.follow_me_ignore_busy === true;
            if (!this.followMe.destinations) this.followMe.destinations = [];
            this.fmDestIsExternal = this.followMe.destinations.map(d => this._isFmExternal(d.follow_me_destination));
          }).catch(() => {});
        }
      }).catch(() => {});
    });
  }

  private _isFmExternal(dest: string): boolean {
    if (!dest) return false;
    return dest.startsWith('+') || dest.length > 7;
  }
  isFmExternalMode(i: number): boolean { return !!this.fmDestIsExternal[i]; }
  toggleFmExternal(i: number) {
    this.fmDestIsExternal[i] = !this.fmDestIsExternal[i];
    this.followMe.destinations[i].follow_me_destination = '';
  }
  addFmDest() {
    const d = new FollowMeDestination();
    d.follow_me_order = (this.followMe.destinations.length + 1) * 10;
    this.followMe.destinations.push(d);
    this.fmDestIsExternal.push(false);
  }
  removeFmDest(i: number) {
    this.followMe.destinations.splice(i, 1);
    this.fmDestIsExternal.splice(i, 1);
  }

  save() {
    this.errorText = [];
    if (!this.ext.extension) { this.errorText.push('Extension number is required'); }
    if (!this.ext.password) { this.errorText.push('Password is required'); }
    if (!this.ext.effective_caller_id_number) { this.errorText.push('Effective Caller ID Number is required'); }
    if (this.extensionConflict) { this.errorText.push(this.extensionConflict); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    this.ext.user_id = this.linked_user_id !== '' ? +this.linked_user_id : null;

    const action = this.isEdit
      ? this.service.update(this.ext)
      : this.service.create(this.ext);

    action.then((result: any) => {
      const extUuid = this.isEdit ? this.ext.extension_uuid : (result?.extension_uuid || null);
      if (extUuid) this.followMe.extension_uuid = extUuid;

      const hasFmData = this.followMe.follow_me_enabled ||
                        this.followMe.destinations.length > 0 ||
                        this.fmIsEdit;
      if (!hasFmData) return Promise.resolve();

      const fmPayload = {
        ...this.followMe,
        follow_me_enabled:     this.followMe.follow_me_enabled     ? 'true' : 'false',
        follow_me_ignore_busy: this.followMe.follow_me_ignore_busy ? 'true' : 'false',
      };
      return this.fmIsEdit
        ? this.followMeService.update(fmPayload as any)
        : this.followMeService.add(fmPayload as any);
    }).then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/fpbx_extension/extensions']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
