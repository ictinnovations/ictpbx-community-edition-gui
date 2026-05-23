import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { Provider } from './provider';
import { ProviderService } from './provider.service';
import 'rxjs/add/operator/toPromise';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-add-provider-component',
  templateUrl: './provider-form-component.html',
  styleUrls: ['./provider-form-component.scss'],
})

export class AddProviderComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private provider_service: ProviderService,
  private router: Router, private app_service : AppService) { }


  form1: any= {};
  provider: Provider= new Provider;
  provider_id: any= null;
  fax_support: boolean = false;
  ip_auth: boolean = false;

  isError = false;
  errorText: any = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.provider_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        this.provider.active = '1';
        this.provider.type = 'sip';
        this.provider.service_flag = 1;
        this.provider.register = 'true';
        this.provider.enabled = 'true';
        this.provider.profile = 'external';
        this.provider.context = 'public';
        this.provider.register_transport = 'udp';
        this.provider.expire_seconds = 800;
        this.provider.retry_seconds = 30;
        this.provider.codec_prefs = 'PCMU,PCMA,OPUS,G722';
        this.ip_auth = false;
        this.provider.distinct_to = 'false';
        this.provider.caller_id_in_from = 'false';
        this.provider.supress_cng = 'false';
        this.provider.sip_cid_type = 'none';
        this.provider.extension_in_contact = 'false';
        this.provider.contact_in_ping = 'false';
        this.fax_support = false;
        return null;
      } else {
        return this.provider_service.get_ProviderData(this.provider_id).then(data => {
          this.provider = data;
          const sf = Number(data.service_flag) || 1;
          this.fax_support = (sf & 2) > 0;
          // IP-auth providers have no username (or '<none>'/'anonymous' style placeholder).
          this.ip_auth = !data.username || data.username === '' || data.username === 'anonymous';
        });
      }
    });
  }

  private computeServiceFlag(): number {
    return 1 | (this.fax_support ? 2 : 0);
  }

  onFaxSupportChange(): void {
    if (this.fax_support) {
      // T.38 first so FreeSWITCH negotiates it ahead of audio codecs for fax-capable trunks.
      this.provider.codec_prefs = 'T38,PCMU,PCMA';
    } else {
      this.provider.codec_prefs = 'PCMU,PCMA,OPUS,G722';
    }
  }

  onIpAuthChange(): void {
    // IP-auth trunks have no SIP digest credentials. Clear them and disable REGISTER —
    // the carrier whitelists our SIP signaling IP instead.
    if (this.ip_auth) {
      this.provider.username = '';
      this.provider.password = '';
      this.provider.auth_username = '';
      this.provider.register = 'false';
    } else {
      this.provider.register = 'true';
    }
  }

  addProvider(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.provider.service_flag = this.computeServiceFlag();
      this.provider_service.add_Provider(this.provider).then(response => {
        this.app_service.success_message = 'Provider created succussfully';
        this.clearMsg();
        this.router.navigate(['/pages/provider/provider']);
      }).catch(err => {
        this.app_service.err_message = 'Error occurred while creating Provider';
        this.clearMsg();
      });
    }else{
      this.app_service.err_message = 'Error occurred while creating Provider';
      this.clearMsg();
    }
  }

  updateProvider(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.provider.service_flag = this.computeServiceFlag();
      this.provider_service.update_Provider(this.provider).then(() => {
        this.app_service.success_message = 'Provider updated successfully';
        this.clearMsg();
        this.router.navigate(['/pages/provider/provider']);
      }).catch(err => {
        this.app_service.err_message = 'Error occurred while updating Provider';
        this.clearMsg();
      });
    }else{
      this.app_service.err_message = 'Error occurred while updating Provider';
      this.clearMsg();
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }
  
  private checkFields(status = null):any{
    this.errorHandler(false, [])
    if (!this.provider.name) this.errorText.push("Provider name is required.");
    // if (!this.provider.gateway_flag) this.errorText.push("Please select Gateway Type.");
    // if (!this.provider.username) this.errorText.push("Username is required.");
    // if (!this.provider.password) this.errorText.push("Password is required.");
    if (!this.provider.host) this.errorText.push("Host is required.");
    // if (!this.provider.port) this.errorText.push("Port is required.");
    // if (!this.provider.prefix) this.errorText.push("Prefix is required.");
    // if (!this.provider.weight) this.errorText.push("Weight is required.");
  }

  private errorHandler(status, message):any{
    this.isError = status;
    this.errorText = message;
    if (status) {
      setTimeout(() => {
        this.isError = false;
        this.errorText = [];
      }, 10000);
    }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
