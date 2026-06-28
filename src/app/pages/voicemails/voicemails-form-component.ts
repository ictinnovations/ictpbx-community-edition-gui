import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VoicemailService } from './voicemails.service';
import { Voicemail } from './voicemails';
import { ExtensionCheckService } from '../../services/extension-check.service';

@Component({
  selector: 'ngx-voicemails-form',
  templateUrl: './voicemails-form-component.html',
  styleUrls: ['./voicemails-form-component.scss'],
})
export class AddVoicemailComponent implements OnInit {

  voicemail: Voicemail = new Voicemail();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  extensionConflict: string | null = null;

  // Greeting upload state
  greetingFile: File | null = null;
  greetingName: string = '';
  greetingUploading: boolean = false;
  greetingError: string = '';
  greetingSuccess: string = '';
  deletingUuid: string | null = null;

  fileOptions = [
    { value: 'attach', label: 'Attach to email' },
    { value: 'link',   label: 'Link in email' },
    { value: 'none',   label: 'Do not send' },
  ];

  constructor(
    private service: VoicemailService,
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
      this.extCheck.nextAvailable().then(n => { if (n) this.voicemail.voicemail_id = n; });
    }
    if (uuid) {
      this.isEdit = true;
      this.service.get_VoicemailData(uuid).then(data => {
        this.voicemail = data;
        if (!this.voicemail.greetings) { this.voicemail.greetings = []; }
      });
    }
  }

  save() {
    this.errorText = [];
    if (!this.voicemail.voicemail_id) { this.errorText.push('Box number is required'); }
    if (!this.voicemail.voicemail_password) { this.errorText.push('Password is required'); }
    if (this.extensionConflict) { this.errorText.push(this.extensionConflict); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const action = this.isEdit
      ? this.service.update_Voicemail(this.voicemail)
      : this.service.add_Voicemail(this.voicemail);

    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/voicemails/voicemails']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.greetingFile = input.files?.[0] || null;
  }

  uploadGreeting() {
    if (!this.greetingFile) { this.greetingError = 'Please select a file.'; return; }
    this.greetingUploading = true;
    this.greetingError = '';
    this.greetingSuccess = '';
    this.service.uploadGreeting(this.voicemail.voicemail_uuid, this.greetingFile, this.greetingName)
      .then(g => {
        this.voicemail.greetings = [...(this.voicemail.greetings || []), g];
        this.greetingFile = null;
        this.greetingName = '';
        this.greetingSuccess = 'Greeting uploaded successfully.';
      })
      .catch(() => { this.greetingError = 'Upload failed. Please try again.'; })
      .then(() => { this.greetingUploading = false; });
  }

  deleteGreeting(greeting_uuid: string) {
    this.deletingUuid = greeting_uuid;
    this.greetingError = '';
    this.service.deleteGreeting(greeting_uuid)
      .then(() => {
        this.voicemail.greetings = (this.voicemail.greetings || []).filter(g => g.voicemail_greeting_uuid !== greeting_uuid);
      })
      .catch(() => { this.greetingError = 'Delete failed. Please try again.'; })
      .then(() => { this.deletingUuid = null; });
  }
}
