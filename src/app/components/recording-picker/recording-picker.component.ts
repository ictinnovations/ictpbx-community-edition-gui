import { Component, OnInit, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Http, Headers, RequestOptions } from '@angular/http';
import { AppService } from '../../app.service';

interface RecordingItem {
  recording_id: number;
  name: string;
  file_name: string;
  type?: string;
}

@Component({
  selector: 'ngx-recording-picker',
  templateUrl: './recording-picker.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RecordingPickerComponent),
    multi: true,
  }],
})
export class RecordingPickerComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder = 'e.g. ivr/ivr-welcome_to_freeswitch.wav';

  recordings: RecordingItem[] = [];
  mode: 'library' | 'custom' = 'custom';
  selectedId: number | string = '';
  currentValue = '';

  showUpload = false;
  uploadFile: File | null = null;
  uploadName = '';
  uploading = false;
  uploadError = '';

  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor(private http: Http, private appService: AppService) {}

  ngOnInit() {
    this.loadRecordings();
  }

  private loadRecordings() {
    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    this.http.get(this.appService.apiUrlRecording, new RequestOptions({ headers }))
      .toPromise()
      .then(r => { this.recordings = r.json() as RecordingItem[]; this.syncSelection(); })
      .catch(() => {});
  }

  private syncSelection() {
    if (!this.currentValue) return;
    const match = this.recordings.find(r => r.file_name === this.currentValue);
    if (match) { this.mode = 'library'; this.selectedId = match.recording_id; }
  }

  writeValue(v: string) {
    this.currentValue = v || '';
    this.syncSelection();
  }
  registerOnChange(fn: any) { this._onChange = fn; }
  registerOnTouched(fn: any) { this._onTouched = fn; }

  switchMode(m: 'library' | 'custom') {
    this.mode = m;
    this.selectedId = '';
    this.currentValue = '';
    this._onChange('');
    this._onTouched();
  }

  onSelectRecording() {
    const rec = this.recordings.find(r => r.recording_id === +this.selectedId);
    this.currentValue = rec ? rec.file_name : '';
    this._onChange(this.currentValue);
    this._onTouched();
  }

  onCustomChange(v: string) {
    this.currentValue = v;
    this._onChange(v);
    this._onTouched();
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    this.uploadFile = input.files?.[0] || null;
    if (this.uploadFile && !this.uploadName) {
      this.uploadName = this.uploadFile.name.replace(/\.[^.]+$/, '');
    }
  }

  uploadRecording() {
    if (!this.uploadFile || !this.uploadName) return;
    this.uploading = true;
    this.uploadError = '';
    const headers = new Headers();
    this.appService.createAuthorizationHeader(headers);
    const opts = new RequestOptions({ headers });
    let newId: number;
    this.http.post(this.appService.apiUrlRecording, JSON.stringify({ name: this.uploadName }), opts)
      .toPromise()
      .then(r => { newId = r.json(); return this.doUploadMedia(newId); })
      .then(() => this.http.get(`${this.appService.apiUrlRecording}/${newId}`, opts).toPromise())
      .then(r => {
        const rec: RecordingItem = r.json();
        this.currentValue = rec.file_name;
        this._onChange(rec.file_name);
        this.uploading = false;
        this.showUpload = false;
        this.uploadFile = null;
        this.uploadName = '';
        this.loadRecordings();
      })
      .catch(() => {
        this.uploading = false;
        this.uploadError = 'Upload failed. Please try again.';
      });
  }

  private doUploadMedia(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('file', this.uploadFile!);
      xhr.open('PUT', `${this.appService.apiUrlRecording}/${id}/media`, true);
      this.appService.upload_Header.forEach(h => xhr.setRequestHeader(h.name, h.value));
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(fd);
    });
  }
}
