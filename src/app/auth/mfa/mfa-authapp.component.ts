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
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'ngx-mfa-authapp',
  templateUrl: './mfa-authapp.component.html',
  styleUrls: ['./mfa-authapp.component.scss']
})
export class MfaAuthappComponent implements OnInit {

  img = "../../../../assets/images/ictpbx-logo.png";

  constructor(private user_service: AUserService, 
    private MfaService: MfaService,
    private modalService: NgbModal, 
    private authService: NbAuthService,
    private router: Router,
    private translateService: TranslateService, 
    private windowService: NbWindowService,
    private http: Http, private app_service: AppService,
    private clipboard: Clipboard
  ) {
    this.authService.onTokenChange().subscribe((token: NbAuthJWTToken) => {
      if (token && token.isValid() && token.getValue()) {
        this.aUser = token.getPayload();
      } else {
        this.router.navigate(['auth/login']);
      }
    });
  }

  aUser: any;
  user: any;
  mfa: Mfa = new Mfa;

  ngOnInit(): void {
    this.MfaService.getUserlist(this.aUser.user_id).then(data => {
      this.user = data;
      if (this.user.appsecret && this.user.auth_type == 'app') {
        this.mfa.totpSecret = this.user.appsecret;
      } else {
        this.generateSecretAndQrCode();
      }
    });
    
  }

  generateSecretAndQrCode() {
    this.mfa.totpUser = {"username": this.user.username};
    this.MfaService.TOTPqrCode(this.mfa.totpUser).then(data => {
      this.mfa.totpSecret = data.secret;
      this.mfa.qrCodeUrl = data.qrCodeUrl;
    }).catch(error => {
      console.error('Error fetching TOTP data:', error);
    }); 
  }

  verifySecret() {
    let verifyData = {
      "code": this.mfa.verificationCode,
      "secret": this.mfa.totpSecret
    };
    this.MfaService.TOTPVerify(verifyData).then(data => {
      if (data) {
        // update usr table with auth type and verify
        this.user.auth_type = "app";
        this.user.verify = 1;
        this.user.appsecret = this.mfa.totpSecret;
        this.user_service.update_User(this.user).then(data => {
          this.router.navigate(['/dashboard']);
        });
      } else {
        this.mfa.verificationError = "Verification error: code is incorrect or expired.";
      }
    });
  }

  copySecret(): void {
    this.clipboard.copy(this.mfa.totpSecret);
  }

  navigateToMFA(): void {
    this.MfaService.navigateToMFA();
  }

}
