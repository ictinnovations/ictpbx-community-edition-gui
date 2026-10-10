import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConferenceCenterService } from './conferences.service';
import { ConferenceCenter } from './conferences';
import { ExtensionCheckService } from '../../services/extension-check.service';

@Component({
  selector: 'ngx-conferences-form',
  templateUrl: './conferences-form.component.html',
})
export class ConferencesFormComponent implements OnInit {

  item: ConferenceCenter = new ConferenceCenter();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  extensionConflict: string | null = null;

  constructor(
    private service: ConferenceCenterService,
    private router: Router,
    private route: ActivatedRoute,
    private extCheck: ExtensionCheckService,
  ) {}

  checkExtension(value: string) {
    if (!value || this.isEdit) { this.extensionConflict = null; return; }
    this.extCheck.check(value).then(r => {
      this.extensionConflict = r.available ? null : `Already in use by ${r.used_by}`;
    });
  }

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (!uuid) {
      this.extCheck.nextAvailable().then(n => { if (n) this.item.conference_center_extension = n; });
    }
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => this.item = data);
    }
  }

  save() {
    this.errorText = [];
    if (!this.item.conference_center_name) { this.errorText.push('Name is required'); }
    if (!this.item.conference_center_extension) { this.errorText.push('Extension is required'); }
    if (this.extensionConflict) { this.errorText.push(this.extensionConflict); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update(this.item)
      : this.service.add(this.item);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/conferences/conferences']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
