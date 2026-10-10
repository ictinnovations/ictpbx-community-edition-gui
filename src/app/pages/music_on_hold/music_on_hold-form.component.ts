import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MusicOnHoldService } from './music_on_hold.service';
import { MusicOnHold } from './music_on_hold';

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

  constructor(private service: MusicOnHoldService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) { this.isEdit = true; this.service.getData(uuid).then(data => this.item = data); }
  }

  save() {
    this.errorText = [];
    if (!this.item.music_on_hold_name) { this.errorText.push('Name is required'); }
    if (this.errorText.length > 0) { this.isError = true; return; }
    const action = this.isEdit ? this.service.update(this.item) : this.service.add(this.item);
    action.then(() => {
      this.isSuccess = true; this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/music_on_hold/music_on_hold']), 1000);
    }).catch(err => { this.isError = true; this.errorText = [err.message || 'Save failed']; });
  }
}
