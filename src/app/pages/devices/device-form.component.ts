import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Headers, Http, RequestOptions } from '@angular/http';
import { DeviceService } from './device.service';
import { Device } from './device';
import { DeviceProfileService } from './device-profile.service';
import { DeviceProfile } from './device-profile';
import { DeviceLine } from './device-line';
import { AppService } from '../../../app/app.service';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-device-form',
  templateUrl: './device-form.component.html',
  styleUrls: ['./device-form.component.scss'],
})
export class DeviceFormComponent implements OnInit {

  device: Device = new Device();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  profiles: DeviceProfile[] = [];
  provisioningUrl: string = null;
  isAdmin = localStorage.getItem('is_admin') === '1';

  vendorList: { name: string; models: string[] }[] = [];
  modelList: string[] = [];

  lines: DeviceLine[] = [];
  extensions: DestOption[] = [];
  deletedLineUuids: string[] = [];

  constructor(
    private service: DeviceService,
    private profileService: DeviceProfileService,
    private pbxDest: PbxDestinationService,
    private http: Http,
    private app_service: AppService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const tenantId = this.isAdmin ? 0 : parseInt(localStorage.getItem('tenant_id') || '0', 10);
    this.profileService.getList(tenantId).then(data => this.profiles = data);
    this._loadVendors();
    this.pbxDest.getExtensions().then(exts => this.extensions = exts);

    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.device = data;
        this.device.device_enabled = (data.device_enabled as any) === 'true' || (data.device_enabled as any) === true;
        if (data.device_vendor) this._setModelsForVendor(data.device_vendor);
        const mac = (data.device_address || '').replace(/[:\-]/g, '').toLowerCase();
        if (mac.length === 12) {
          this.provisioningUrl = `${window.location.origin}/provision/${mac}`;
        }
        this._loadLines(uuid);
      });
    }
  }

  private _loadVendors() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    this.http.get(this.app_service.apiUrlDeviceVendors, options).toPromise()
      .then(r => {
        this.vendorList = r.json();
        if (this.device.device_vendor) this._setModelsForVendor(this.device.device_vendor);
      })
      .catch(() => {});
  }

  private _loadLines(device_uuid: string) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });
    this.http.get(`${this.app_service.apiUrlDeviceLines}?device_uuid=${device_uuid}`, options).toPromise()
      .then(r => {
        const rows = r.json() || [];
        this.lines = rows.map((row: any) => {
          const line = new DeviceLine();
          Object.assign(line, row);
          line.enabled = (row.enabled as any) === 'true' || (row.enabled as any) === true;
          return line;
        });
      })
      .catch(() => {});
  }

  onVendorChange(vendor: string) {
    this.device.device_vendor = vendor;
    this.device.device_model = null;
    this.device.device_template = null;
    this._setModelsForVendor(vendor);
  }

  onModelChange(model: string) {
    this.device.device_model = model;
    if (this.device.device_vendor && model) {
      this.device.device_template = `${this.device.device_vendor}/${model}`;
    }
  }

  private _setModelsForVendor(vendor: string) {
    const entry = this.vendorList.find(v => v.name === vendor);
    this.modelList = entry ? entry.models : [];
  }

  addLine() {
    const line = new DeviceLine();
    line.line_number = String(this.lines.length + 1);
    line.server_address = window.location.hostname;
    this.lines.push(line);
  }

  removeLine(i: number) {
    const line = this.lines[i];
    if (line.device_line_uuid) {
      this.deletedLineUuids.push(line.device_line_uuid);
    }
    this.lines.splice(i, 1);
  }

  getExtOption(extension_uuid: string): DestOption {
    return this.extensions.find(e => e.uuid === extension_uuid) || null;
  }

  onExtensionSelect(i: number, ext: DestOption) {
    if (!ext) return;
    this.lines[i].extension_uuid = ext.uuid;
    this.lines[i].user_id = ext.extension;
    this.lines[i].auth_id = ext.extension;
    const parts = ext.label.split(' – ');
    this.lines[i].display_name = parts.length > 1 ? parts[1] : '';
  }

  save() {
    this.errorText = [];
    if (!this.device.device_address) {
      this.errorText.push('MAC address is required');
    } else {
      const macHex = this.device.device_address.replace(/[^a-fA-F0-9]/g, '');
      if (macHex.length !== 12) {
        this.errorText.push('MAC address must be 12 hex characters (e.g. 000b8201fc42 or 00:0B:82:01:FC:42)');
      }
    }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update(this.device)
      : this.service.create(this.device);

    action.then(result => {
      const device_uuid = this.isEdit ? this.device.device_uuid : result as string;
      if (!this.isEdit && result) {
        this.device.device_uuid = result as string;
        const mac = (this.device.device_address || '').replace(/[:\-]/g, '').toLowerCase();
        if (mac.length === 12) {
          this.provisioningUrl = `${window.location.origin}/provision/${mac}`;
        }
      }
      this._saveLines(device_uuid).then(() => {
        this.isSuccess = true;
        this.isError = false;
        setTimeout(() => this.router.navigate(['/pages/devices/devices']), 1000);
      }).catch(err => {
        this.isError = true;
        this.errorText = [err.message || 'Line save failed'];
      });
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }

  private _saveLines(device_uuid: string): Promise<void> {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers });

    const deleteOps = this.deletedLineUuids.map(uuid =>
      this.http.delete(`${this.app_service.apiUrlDeviceLines}/${uuid}`, options).toPromise()
    );

    return Promise.all(deleteOps).then(() => {
      const saveOps = this.lines.map((line, i) => {
        line.device_uuid = device_uuid;
        line.line_number = String(i + 1);
        if (line.device_line_uuid) {
          return this.http.put(`${this.app_service.apiUrlDeviceLines}/${line.device_line_uuid}`,
            JSON.stringify(line), options).toPromise();
        } else {
          return this.http.post(this.app_service.apiUrlDeviceLines,
            JSON.stringify(line), options).toPromise();
        }
      });
      return Promise.all(saveOps).then(() => {
        this.deletedLineUuids = [];
      });
    });
  }
}
