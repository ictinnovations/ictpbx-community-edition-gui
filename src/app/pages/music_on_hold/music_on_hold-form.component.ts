import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MusicOnHoldService } from './music_on_hold.service';
import { MusicOnHold, MusicOnHoldFile } from './music_on_hold';

@Component({
  selector: 'ngx-moh-form',
  templateUrl: './music_on_hold-form.component.html',
})
export class MusicOnHoldFormComponent implements OnInit {

  item: MusicOnHold = new MusicOnHold();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];
  isAdmin = localStorage.getItem('is_admin') === '1';

  files: MusicOnHoldFile[] = [];
  selectedFile: File = null;
  uploading = false;
  deletingId: string = null;
  fileError = '';
  fileSuccess = '';

  constructor(private service: MusicOnHoldService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) { this.isEdit = true; this.load(uuid); }
  }

  load(uuid: string) {
    this.service.getData(uuid).then(data => {
      this.item = data;
      if (this.item.uses_uploads) this.loadFiles();
    });
  }

  loadFiles() {
    this.service.listFiles(this.item.music_on_hold_uuid).then(files => this.files = files || []);
  }

  save() {
    this.errorText = [];
    if (!this.item.music_on_hold_name) { this.errorText.push('Name is required'); }
    if (this.errorText.length > 0) { this.isError = true; return; }
    const action = this.isEdit ? this.service.update(this.item) : this.service.add(this.item);
    action.then(result => {
      this.isSuccess = true; this.isError = false;
      if (this.isEdit) {
        setTimeout(() => this.router.navigate(['/pages/music_on_hold/music_on_hold']), 1000);
      } else {
        // Stay on the form so music can be uploaded straight away.
        setTimeout(() => this.router.navigate(['/pages/music_on_hold/music_on_hold', result]), 800);
      }
    }).catch(err => { this.isError = true; this.errorText = [err.message || 'Save failed']; });
  }

  useUploads() {
    this.item.music_on_hold_path = '';
    this.service.update(this.item).then(() => this.load(this.item.music_on_hold_uuid))
      .catch(err => { this.isError = true; this.errorText = [err.message || 'Save failed']; });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files && event.target.files.length ? event.target.files[0] : null;
    this.fileError = '';
    this.fileSuccess = '';
  }

  upload(input: HTMLInputElement) {
    if (!this.selectedFile) return;
    if (this.selectedFile.size > 20 * 1024 * 1024) { this.fileError = 'File is larger than 20 MB'; return; }
    this.uploading = true;
    this.fileError = '';
    this.fileSuccess = '';
    this.service.uploadFile(this.item.music_on_hold_uuid, this.selectedFile).then(f => {
      this.fileSuccess = `Uploaded ${f.name}`;
      this.selectedFile = null;
      input.value = '';
      this.loadFiles();
    }).catch(err => this.fileError = err.message || 'Upload failed')
      .then(() => this.uploading = false);
  }

  deleteFile(f: MusicOnHoldFile) {
    this.deletingId = f.file_id;
    this.fileError = '';
    this.fileSuccess = '';
    this.service.deleteFile(this.item.music_on_hold_uuid, f.file_id).then(() => {
      this.fileSuccess = `Deleted ${f.name}`;
      this.loadFiles();
    }).catch(err => this.fileError = err.message || 'Delete failed')
      .then(() => this.deletingId = null);
  }

  fileSize(bytes: number): string {
    return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }
}
