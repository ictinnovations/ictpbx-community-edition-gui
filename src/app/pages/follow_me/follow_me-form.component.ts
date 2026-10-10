import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FollowMeService } from './follow_me.service';
import { FollowMe, FollowMeDestination } from './follow_me';
import { PbxDestinationService, DestOption } from '../../services/pbx-destination.service';

@Component({
  selector: 'ngx-follow-me-form',
  templateUrl: './follow_me-form.component.html',
})
export class FollowMeFormComponent implements OnInit {

  item: FollowMe = new FollowMe();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];

  extensions: DestOption[] = [];
  destIsExternal: boolean[] = [];

  constructor(
    private service: FollowMeService,
    private router: Router,
    private route: ActivatedRoute,
    private pbxDest: PbxDestinationService,
  ) {}

  ngOnInit() {
    this.pbxDest.getExtensions().then(exts => {
      this.extensions = exts;
    });

    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.item = data;
        this.item.follow_me_enabled = (data.follow_me_enabled as any) === 'true' || data.follow_me_enabled === true;
        this.item.follow_me_ignore_busy = (data.follow_me_ignore_busy as any) === 'true' || data.follow_me_ignore_busy === true;
        if (!this.item.destinations) this.item.destinations = [];
        this.destIsExternal = this.item.destinations.map(d => this.isExternal(d.follow_me_destination));
      });
    }
  }

  private isExternal(dest: string): boolean {
    if (!dest) return false;
    return dest.startsWith('+') || dest.length > 7;
  }

  isExternalDest(i: number): boolean {
    return !!this.destIsExternal[i];
  }

  toggleExternal(i: number) {
    this.destIsExternal[i] = !this.destIsExternal[i];
    this.item.destinations[i].follow_me_destination = '';
  }

  addDestination() {
    const d = new FollowMeDestination();
    d.follow_me_order = (this.item.destinations.length + 1) * 10;
    this.item.destinations.push(d);
    this.destIsExternal.push(false);
  }

  removeDestination(i: number) {
    this.item.destinations.splice(i, 1);
    this.destIsExternal.splice(i, 1);
  }

  save() {
    this.errorText = [];
    if (this.errorText.length > 0) { this.isError = true; return; }

    const payload = {
      ...this.item,
      follow_me_enabled: this.item.follow_me_enabled ? 'true' : 'false',
      follow_me_ignore_busy: this.item.follow_me_ignore_busy ? 'true' : 'false',
    };
    const action = this.isEdit ? this.service.update(payload as any) : this.service.add(payload as any);
    action.then(() => {
      this.isSuccess = true; this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/follow_me/follow_me']), 1000);
    }).catch(err => { this.isError = true; this.errorText = [err.message || 'Save failed']; });
  }
}
