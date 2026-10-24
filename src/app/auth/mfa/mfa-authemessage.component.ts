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
  selector: 'ngx-mfa-authemessage',
  templateUrl: './mfa-authemessage.component.html',
  styleUrls: ['./mfa-authemessage.component.scss']
})
export class MfaAuthemessageComponent implements OnInit {

  img = "../../../../assets/images/ictpbx-logo.png";

  constructor(private user_service: AUserService, 
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
  user: any;
  vcode: number;
  httpSMS: any;
  mfa: Mfa = new Mfa;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    console.log(this);
    if (this.aUser.tenant_id) {
      this.MfaService.getUserlist(this.aUser.user_id).then(data => {
        this.user = data;
        console.log(this.user);
      });
    }
  }

  navigateToMFA(): void {
    this.MfaService.navigateToMFA();
  }

  sendCode(): void {
    const result: VerificationCodeResult = this.MfaService.generateNumericVerificationCode();
    this.mfa.vcode      = result.code;
    this.mfa.expiryTime = result.expiryTime;

    const provider  = {"type": "http", "service_flag": 4};

    this.MfaService.searchProvider(provider).then(data => {
      // Extract the host value from the first element in the data array.
      const host    = data[0]['host'];
      // Construct the URL.
      const url     = `https://${host}/messages/http/send`;
      const to      = this.user.phone;
      const content = `Your verification code for ICTFax Multi-factor authentication is ${this.mfa.vcode}`;
      const apiKey  = data[0]['httpkey'];
      this.MfaService.sendSms(apiKey, to, content, url).then(data => {
        this.httpSMS = data;
        this.errorMessage = null;  // Clear any previous error message
      }).catch(error => {
        this.mfa.vcode = '';
        this.errorMessage = error;
      });
    });
  }

  onResendClick() {
    this.sendCode();
  }

  onVerifyClick() {
    if (this.mfa.verificationCode == this.mfa.vcode && Date.now() < this.mfa.expiryTime) {
      // update usr table with auth type and verify
      this.user.auth_type = "message";
      this.user.verify = 1;
      this.user_service.update_User(this.user).then(data => {
        this.router.navigate(['/dashboard']);
      });
    } else {
      this.mfa.verificationError = "Verification error: code is incorrect or expired.";
    }
  }

}
