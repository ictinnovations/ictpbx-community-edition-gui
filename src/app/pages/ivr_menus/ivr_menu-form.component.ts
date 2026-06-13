import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IvrMenuService } from './ivr_menu.service';
import { IvrMenu, IvrMenuOption } from './ivr_menu';
import { ExtensionCheckService } from '../../services/extension-check.service';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

@Component({
  selector: 'ngx-ivr-menu-form',
  templateUrl: './ivr_menu-form.component.html',
  styleUrls: ['./ivr_menu-form.component.scss'],
})
export class IvrMenuFormComponent implements OnInit {

  menu: IvrMenu = new IvrMenu();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  extensionConflict: string | null = null;

  optionActions = [
    'transfer', 'menu', 'hangup', 'playback', 'voicemail',
    'check_voicemail', 'directory', 'set', 'respond',
  ];

  // Destination pickers
  extensions: DestOption[] = [];
  ringGroups: DestOption[] = [];
  ivrMenus:   DestOption[] = [];

  exitDestType = 'extension';
  exitDestValue = '';

  // Per-option type + raw value (when action = 'transfer')
  optionDestType:  string[] = [];
  optionDestValue: string[] = [];

  private ivrContext = 'default';

  constructor(
    private service: IvrMenuService,
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
    ]).then(([exts, rgs, ivrs]) => {
      this.extensions = exts;
      this.ringGroups = rgs;
      this.ivrMenus   = ivrs;
    });

    const uuid = this.route.snapshot.paramMap.get('id');
    if (!uuid) {
      this.extCheck.nextAvailable().then(n => { if (n) this.menu.ivr_menu_extension = n; });
    }
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.menu = data;
        this.menu.ivr_menu_enabled = (data.ivr_menu_enabled as any) === 'true' || (data.ivr_menu_enabled as any) === true;
        this.menu.ivr_menu_direct_dial = (data.ivr_menu_direct_dial as any) === 'true' || (data.ivr_menu_direct_dial as any) === true;
        if (!this.menu.options) this.menu.options = [];
        this.menu.options = this.menu.options.map(opt => ({
          ...opt,
          ivr_menu_option_enabled: (opt.ivr_menu_option_enabled as any) === 'true' || (opt.ivr_menu_option_enabled as any) === true,
        }));
        const { type, value } = this.parseIvrDest(this.menu.ivr_menu_exit_data);
        this.exitDestType  = type;
        this.exitDestValue = value;
        this.optionDestType  = this.menu.options.map(o => this.parseIvrDest(o.ivr_menu_option_param).type);
        this.optionDestValue = this.menu.options.map(o => this.parseIvrDest(o.ivr_menu_option_param).value);
      });
    }
  }

  private parseIvrDest(val: string): { type: string; value: string } {
    if (!val) return { type: 'extension', value: '' };
    // Format: "1001 XML default" — extract just the extension number
    const m = val.match(/^(\S+)\s+XML\s+/i);
    if (m) return { type: 'extension', value: m[1] };
    return { type: 'extension', value: val };
  }

  private buildIvrDest(type: string, value: string): string {
    if (!value) return '';
    const ctx = this.ivrContext || 'default';
    return `${value} XML ${ctx}`;
  }

  get exitDestList(): DestOption[] {
    switch (this.exitDestType) {
      case 'ring_group': return this.ringGroups;
      case 'ivr':        return this.ivrMenus;
      default:           return this.extensions;
    }
  }

  onExitDestTypeChange() {
    this.exitDestValue = '';
    this.menu.ivr_menu_exit_data = '';
  }

  onExitDestValueChange() {
    this.menu.ivr_menu_exit_data = this.buildIvrDest(this.exitDestType, this.exitDestValue);
  }

  optionDestList(i: number): DestOption[] {
    switch (this.optionDestType[i]) {
      case 'ring_group': return this.ringGroups;
      case 'ivr':        return this.ivrMenus;
      default:           return this.extensions;
    }
  }

  onOptionDestTypeChange(i: number) {
    this.optionDestValue[i] = '';
    this.menu.options[i].ivr_menu_option_param = '';
  }

  onOptionDestValueChange(i: number) {
    this.menu.options[i].ivr_menu_option_param = this.buildIvrDest(this.optionDestType[i], this.optionDestValue[i]);
  }

  addOption() {
    const opt = new IvrMenuOption();
    opt.ivr_menu_option_order = (this.menu.options.length + 1) * 10;
    this.menu.options.push(opt);
    this.optionDestType.push('extension');
    this.optionDestValue.push('');
  }

  removeOption(i: number) {
    this.menu.options.splice(i, 1);
    this.optionDestType.splice(i, 1);
    this.optionDestValue.splice(i, 1);
  }

  save() {
    this.errorText = [];
    if (!this.menu.ivr_menu_name) this.errorText.push('Name is required');
    if (!this.menu.ivr_menu_extension) this.errorText.push('Extension is required');
    if (this.extensionConflict) { this.errorText.push(this.extensionConflict); }
    if (this.errorText.length) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update(this.menu)
      : this.service.create(this.menu);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/ivr_menus/ivr_menus']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
