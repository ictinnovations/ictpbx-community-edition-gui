import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { IncomingNumber } from './incoming_number';
import { IncomingNumberService } from './incoming_number.service';
import { DIDService } from '../did/did.service';
import { ExtensionService } from '../extension/extension.service';
import { User } from '../user/user';
import { Extension } from '../extension/extension';
import 'rxjs/add/operator/toPromise';
import { AUserService } from '../user/user.service';
import { RingGroupService } from '../ring_groups/ring_groups.service';
import { IvrMenuService } from '../ivr_menus/ivr_menu.service';
import { VoicemailService } from '../voicemails/voicemails.service';
import { InboundRouteService } from '../inbound_routes/inbound_route.service';

@Component({
  selector: 'ngx-forward-incoming-component',
  templateUrl: './forward-incoming_number-component.html',
  styleUrls: ['./forward-incoming_number-component.scss'],
})

export class ForwardIncomingNumberComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private in_number_service: IncomingNumberService,
  private router: Router, private did_service: DIDService, private ext_service: ExtensionService,
  private user_service: AUserService, private ringGroupService: RingGroupService,
  private ivrMenuService: IvrMenuService, private voicemailService: VoicemailService,
  private inboundRouteService: InboundRouteService) { }


  form1: any= {};
  incomingNumber: IncomingNumber= new IncomingNumber;
  id: any= null;
  exts: any = [];
  ringGroups: any[] = [];
  ivrMenus: any[] = [];
  voicemails: any[] = [];
  selectedRingGroup: string = '';
  selectedIvrMenu: string = '';
  selectedVoicemail: string = '';
  user: User = new User;
  extension: Extension = new Extension;
  user_id: any = null;
  accounts: any = null;
  accountsData: any = [];
  foundAccounts: any = [];
  deletedAccounts: any = [];
  newAccounts: any = [];

  ngOnInit(): void {
    const isAdmin  = localStorage.getItem('is_admin')  === '1';
    const isTenant = localStorage.getItem('is_tenant') === '1';
    this.getAllExt();
    if (isAdmin || isTenant) {
      this.ringGroupService.get_RingGroupList().then(data => this.ringGroups = data || []);
      this.ivrMenuService.getList().then(data => this.ivrMenus = data || []);
      this.voicemailService.get_VoicemailList().then(data => this.voicemails = data || []);
    }
    this.route.params.subscribe(params => {
      this.user_id = localStorage.getItem('aid');
      this.getUserData(this.user_id);
      this.id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.in_number_service.get_Data(this.id).then(data => {
          this.incomingNumber = data;
          this.incomingNumber.service_name = '';
        });
      }
    });
  }

  getAllExt() {
    const isAdmin = localStorage.getItem('is_admin') === '1';
    const tenantId = isAdmin ? 0 : Number(localStorage.getItem('tid') || 0);
    this.ext_service.get_FaxExtensionList(tenantId).then(response => {
      this.exts = response || [];
    });
  }


  getUserData(user_id = null) {
    this.user_service.get_UserData(user_id).then(response => {
      this.user = response;
      // Users accounts
      if (this.user.user_id) {
        this.user_service.get_UserAccounts(this.id).then(data => {
          if (data.length) {
            data.forEach(item => {
              if (item.email) {
                this.accountsData.push(item);
                this.foundAccounts.push(item.email);
              }
            });
            this.accounts = this.foundAccounts.join('\n');
          }
        });
      }
    });
  }

  
  updateAccounts(): void {
    if (!this.accounts) return;
    // Collect emails
    let accountsArray = Array.from(new Set(this.accounts.split('\n')));
    // Filter valid emails
    let validEmails = accountsArray.filter(this.isValidEmail);
    // Filter new accounts
    this.newAccounts = validEmails.filter(item => !this.foundAccounts.includes(item));
    // Filter deleted accounts
    this.deletedAccounts = this.foundAccounts.filter(item => !validEmails.includes(item));
    // Delete accounts
    if (this.deletedAccounts.length > 0) {
      // let foundIds = this.foundAccounts.filter(obj => this.deletedAccounts.includes(obj.email)).map(obj => obj.account_id);
      let deletedAccountIds = this.accountsData.filter(account => this.deletedAccounts.includes(account.email)).map(account => account.account_id);
      // Send delete query
      deletedAccountIds.forEach(accountId => {
        this.user_service.get_DeleteAccount(accountId).then(data => {});
      });
    }
    // Add accounts
    this.newAccounts.forEach(email => {
      // Setup account
      const account = {
        tenant_id: this.extension.tenant_id,
        type: 'account',
        username: Math.floor(Math.random() * (999 - 100 + 1)) + 100 + ' ' + email, //.split('@')[0],
        first_name: this.extension.first_name,
        last_name: this.extension.last_name,
        phone: this.extension.phone,
        email: email,
        linkdid_id : this.id,
        address: this.extension.address,
        active: this.extension.active,
      }
      // Add account
      this.user_service.add_Account(account).then(account_id => {
        return true;
      });
    });
    // Redirect to users page
    this.router.navigate(['../../'], {relativeTo: this.route});
  }

  isValidEmail(email) {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email.toLowerCase());
  }

   async forwardDID() {
    const nav = () => this.router.navigate(['../../../incoming_number'], {relativeTo: this.route});

    if (this.incomingNumber.service_name == 'receivefax') {
      this.did_service.no_service(this.incomingNumber.account_id);
      this.in_number_service.forward_did({
        account_id: this.incomingNumber.account_id,
        program_name: 'receivefax'
      }).then(() => nav());
      return;
    }

    if (this.incomingNumber.service_name == 'ring_group') {
      this.did_service.no_service(this.incomingNumber.account_id);
      this.inboundRouteService.create({
        destination_number: this.incomingNumber.phone,
        destination_target_type: 'ring_group',
        destination_target: this.selectedRingGroup,
        destination_context: 'public',
        destination_order: 100,
        destination_enabled: true,
        destination_description: null,
        destination_data: null
      } as any).then(() => nav());
      return;
    }

    if (this.incomingNumber.service_name == 'ivr_menu') {
      this.did_service.no_service(this.incomingNumber.account_id);
      this.inboundRouteService.create({
        destination_number: this.incomingNumber.phone,
        destination_target_type: 'ivr',
        destination_target: this.selectedIvrMenu,
        destination_context: 'public',
        destination_order: 100,
        destination_enabled: true,
        destination_description: null,
        destination_data: null
      } as any).then(() => nav());
      return;
    }

    if (this.incomingNumber.service_name == 'voicemail') {
      this.did_service.no_service(this.incomingNumber.account_id);
      this.inboundRouteService.create({
        destination_number: this.incomingNumber.phone,
        destination_target_type: 'voicemail',
        destination_target: this.selectedVoicemail,
        destination_context: 'public',
        destination_order: 100,
        destination_enabled: true,
        destination_description: null,
        destination_data: null
      } as any).then(() => nav());
      return;
    }

    if(this.incomingNumber.service_name == 'forwardtoext'){
      this.did_service.no_service(this.incomingNumber.account_id)
      this.ext_service.get_ExtensionData(this.incomingNumber.extension_id).then(response => {
        this.incomingNumber.email = response['username'];
        this.in_number_service.update_account(this.incomingNumber).then(response => {});
      });
      await this.sleep(1000);
    }
    if (this.incomingNumber.service_name == 'no_service' ) {
      this.incomingNumber.email = 'No service';
      this.in_number_service.update_account(this.incomingNumber);
      this.did_service.no_service(this.incomingNumber.account_id).then(response => {
        nav();
      });
    } else if (this.incomingNumber.service_name == 'faxtoemail' ) {
      this.did_service.no_service(this.incomingNumber.account_id)
      if (this.incomingNumber.email == null || this.incomingNumber.email == undefined) {
        this.did_service.send_program(this.incomingNumber).then(response => {
          nav();
        });
      } else {
        this.in_number_service.update_account(this.incomingNumber).then(data => {
          this.update_did();
          this.did_service.send_program(this.incomingNumber).then(response => {
            nav();
          });
        })
      }
    } else if (this.incomingNumber.service_name == 'forwardtoext' ) {
        this.incomingNumber.did_id = this.incomingNumber.account_id;
        this.in_number_service.forwardtoext(this.incomingNumber).then(response => {
          nav();
        });
      }
      else {
      }
    this.updateAccounts();
  }

  update_did() {
    this.in_number_service.search_account_Data(this.incomingNumber.email).then(response => {
      if (response.length > 0) {
        this.in_number_service.update_account(this.incomingNumber).then(response => {
        });
      }
    })
  }

  sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
