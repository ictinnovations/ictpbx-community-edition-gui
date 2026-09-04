import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CallBlockService } from './call_block.service';
import { CallBlock } from './call_block';

@Component({
  selector: 'ngx-call-block-form',
  templateUrl: './call_block-form.component.html',
})
export class CallBlockFormComponent implements OnInit {

  item: CallBlock = new CallBlock();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];

  constructor(private service: CallBlockService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.item = data;
        this.item.call_block_enabled = (data.call_block_enabled as any) === 'true' || data.call_block_enabled === true;
      });
    }
  }

  save() {
    this.errorText = [];
    if (!this.item.call_block_name) { this.errorText.push('Name is required'); }
    if (!this.item.call_block_number) { this.errorText.push('Number/Pattern is required'); }
    if (this.errorText.length > 0) { this.isError = true; return; }

    const payload = { ...this.item, call_block_enabled: this.item.call_block_enabled ? 'true' : 'false' };
    const action = this.isEdit ? this.service.update(payload as any) : this.service.add(payload as any);
    action.then(() => {
      this.isSuccess = true; this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/call_block/call_block']), 1000);
    }).catch(err => { this.isError = true; this.errorText = [err.message || 'Save failed']; });
  }
}
