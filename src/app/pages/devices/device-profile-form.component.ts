import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceProfileService } from './device-profile.service';
import { DeviceProfile } from './device-profile';

@Component({
  selector: 'ngx-device-profile-form',
  templateUrl: './device-profile-form.component.html',
  styleUrls: ['./device-profile-form.component.scss'],
})
export class DeviceProfileFormComponent implements OnInit {

  profile: DeviceProfile = new DeviceProfile();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];

  constructor(
    private service: DeviceProfileService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.profile = data;
        this.profile.device_profile_enabled =
          (data.device_profile_enabled as any) === 'true' || (data.device_profile_enabled as any) === true;
      });
    }
  }

  save() {
    this.errorText = [];
    if (!this.profile.device_profile_name) { this.errorText.push('Profile name is required'); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update(this.profile)
      : this.service.create(this.profile);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/devices/profiles']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
