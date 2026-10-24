import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GatewayService } from './gateway.service';
import { Gateway } from './gateway';

@Component({
  selector: 'ngx-gateway-form',
  templateUrl: './gateway-form.component.html',
  styleUrls: ['./gateway-form.component.scss'],
})
export class GatewayFormComponent implements OnInit {

  gw: Gateway = new Gateway();
  isEdit = false;
  isError = false;
  isSuccess = false;
  errorText: string[] = [];

  transports = ['udp', 'tcp', 'tls'];
  profiles = ['external', 'internal'];

  constructor(private service: GatewayService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.isEdit = true;
      this.service.getData(uuid).then(data => {
        this.gw = data;
        this.gw.register = (data.register as any) === 'true' || (data.register as any) === true;
        this.gw.caller_id_in_from = (data.caller_id_in_from as any) === 'true' || (data.caller_id_in_from as any) === true;
        this.gw.enabled = (data.enabled as any) === 'true' || (data.enabled as any) === true;
      });
    }
  }

  save() {
    this.errorText = [];
    if (!this.gw.gateway) this.errorText.push('Gateway name is required');
    if (this.errorText.length) { this.isError = true; return; }

    const action = this.isEdit ? this.service.update(this.gw) : this.service.create(this.gw);
    action.then(() => {
      this.isSuccess = true;
      this.isError = false;
      setTimeout(() => this.router.navigate(['/pages/gateways/gateways']), 1000);
    }).catch(err => {
      this.isError = true;
      this.errorText = [err.message || 'Save failed'];
    });
  }
}
