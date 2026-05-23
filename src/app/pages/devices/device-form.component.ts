import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceService } from './device.service';
import { Device } from './device';

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

  vendors = ['Yealink', 'Polycom', 'Cisco', 'Grandstream', 'Snom', 'Fanvil', 'Generic'];

  constructor(
    private service: DeviceService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.device = data;
        this.device.device_enabled = (data.device_enabled as any) === 'true' || (data.device_enabled as any) === true;
      });
    }
  }

  save() {
    this.errorText = [];
    if (!this.device.device_address) { this.errorText.push('MAC address is required'); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update(this.device)
      : this.service.create(this.device);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/devices/devices']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
