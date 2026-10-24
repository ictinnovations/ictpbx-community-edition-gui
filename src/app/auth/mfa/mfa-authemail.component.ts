import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { TranslateService } from '@ngx-translate/core';
import { NbWindowService,NbWindowRef} from '@nebular/theme';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Http, Response, HttpModule, RequestOptions } from '@angular/http';
import { MfaService, VerificationCodeResult } from './mfa.service';
import { AppService } from '../../app.service';
import { Mfa } from './mfa';
import { AUserService } from '../../pages/user/user.service';
import { empty } from 'rxjs';
import 'rxjs/add/operator/toPromise';


@Component({
  selector: 'ngx-mfa-authemail',
  templateUrl: './mfa-authemail.component.html',
  styleUrls: ['./mfa-authemail.component.scss']
})
export class MfaAuthemailComponent implements OnInit {

  img = "../../../../assets/images/ictpbx-logo.png";
  

  constructor(
    private user_service: AUserService, 
    private MfaService: MfaService,
    private modalService: NgbModal, 
    private authService: NbAuthService,
    private router: Router,
    private translateService: TranslateService, 
    private windowService: NbWindowService,
    private http: Http, private app_service: AppService) 
  {
    this.authService.onTokenChange().subscribe((token: NbAuthJWTToken) => {
      if (token && token.isValid() && token.getValue()) {
        this.aUser = token.getPayload();
      } else {
        this.router.navigate(['auth/login']);
      }
    });
  }

  aUser: any;
  is_admin: any = 0;
  is_tenant: any = 0;
  tenant_id: number = 0;
  user_id: number = 0;
  user: any;
  mfa: Mfa = new Mfa;
  
  ngOnInit(): void {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    this.MfaService.getUserlist(this.aUser.user_id).then(data => {
      this.user = data;
      console.log(this.user);
    });
  }

  sendCode() {
    console.log("code send");
    this.sendVerificationCode();
  }

  sendVerificationCode(): void {
    const result: VerificationCodeResult = this.MfaService.generateNumericVerificationCode();
    this.mfa.vcode      = result.code;
    this.mfa.expiryTime = result.expiryTime;
      
    //create template
    this.mfa.template = {
      name: "sendemailverify",
      description: "ICTFax auth code",
      subject: "ICTFax MFA",
      body: `Your verification code for ICTFax Multi-factor authentication is ${this.mfa.vcode}`
    };
    this.MfaService.TemplateCreate(this.mfa.template).then(data => {
      this.mfa.template_id = data;
      // create program
      this.mfa.email = {
        "name": "sendemail",
        "template_id": this.mfa.template_id
      };
      this.MfaService.send_email_program(this.mfa.email).then(data => {
        this.mfa.program_id = data;
        this.MfaService.getUserlist(this.aUser.user_id).then(data => {
          this.user = data;
          // search account data
          this.MfaService.search_account_Data(this.user.user_id).then(data => {
            if (data && data.length > 0) {
              this.mfa.account_id = data[0].account_id;
            } else {
              console.log('No account data found');
            }
            this.MfaService.searchContact(this.user).then(data => {
              if(data.length > 0) {
                this.mfa.contact_id = data[0].contact_id;
                this.programTransmission();
              } else if (data.length == 0) {
                let contact = {"phone": this.user.phone, "email": this.user.email};
                this.MfaService.createContact(contact).then(data => {
                  this.mfa.contact_id = data;
                  this.programTransmission();
                });
              }
            });
          }).catch(error => {
            this.mfa.vcode = '';
            console.error('Error searching user account', error);
          });        // end account
        }).catch(error => {
          this.mfa.vcode = '';
          console.error('Error get userList', error);
        });          // end user list
      }).catch(error => {
        this.mfa.vcode = '';
        console.error('Error creating program', error);
      });            // end create program
    }).catch(error => {
      this.mfa.vcode = '';
      console.error('Error creating template', error);
    });
    //end create template
  }

  navigateToMFA(): void {
    this.MfaService.navigateToMFA();
  }

  onVerifyClick() {
    if (this.mfa.verificationCode == this.mfa.vcode && Date.now() < this.mfa.expiryTime) {
      // update usr table with auth type and verify
      this.user.auth_type = "email";
      this.user.verify = 1;
      this.MfaService.delete_template(this.mfa.template_id).then(data => {
        // console.log("template deleted successfully");
      });
      this.user_service.update_User(this.user).then(data => {
        this.router.navigate(['/dashboard']);
      });

    } else {
      this.mfa.verificationError = "Verification error: code is incorrect or expired.";
    }
    
  }

  onResendClick() {
    this.sendVerificationCode();
  }

  programTransmission() {
    this.mfa.transmission = {
      "title": "ICTFax MFA",
      "origin": "sendemail",
      "service_flag": 8,
      "program_id": this.mfa.program_id,
      "program_data": {
        "program_id": this.mfa.program_id,
        "type": "sendemail",
        "template_id": this.mfa.template_id
      },
      "transmission_data": {
        "contact_id": this.mfa.contact_id,
        "account_id": this.mfa.account_id,
        "direction": "outbound"
      }
    };
    this.MfaService.transmission(this.mfa.transmission, this.mfa.program_id).then(data => {
      this.mfa.transmissionid = data;
      this.MfaService.sendTransmission(this.mfa.transmissionid).then(data => {
        this.mfa.transmissionsendid = data;
      }).catch(error => {
        this.mfa.vcode = '';
        console.error('Error send transmission', error);
      });    // end send transmission
    }).catch(error => {
      this.mfa.vcode = '';
      console.error('Error create tranmission', error);
    });      // end transmission
  }

}
