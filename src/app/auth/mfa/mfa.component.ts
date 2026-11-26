import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { TranslateService } from '@ngx-translate/core';
import { NbWindowService,NbWindowRef} from '@nebular/theme';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MfaService } from './mfa.service';
import { Mfa } from './mfa';
import { NbTabsetComponent } from '@nebular/theme';

import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-mfa',
  templateUrl: './mfa.component.html',
  styleUrls: ['./mfa.component.scss']
})
export class MfaComponent implements OnInit {

  img = "../../../../assets/images/ictpbx-logo.png";

  constructor(
    private MfaService: MfaService, 
    private modalService: NgbModal, 
    private authService: NbAuthService,
    private router: Router,
    private translateService: TranslateService, 
    private windowService: NbWindowService
  ) {
    this.authService.onTokenChange().subscribe((token: NbAuthJWTToken) => {
      if (token.isValid()) {
        console.log("toke valid...");
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
  selectedTab: number = 0;
  isReadOnly: boolean = false;

  @ViewChild('tabset') tabset: NbTabsetComponent;

  ngOnInit(): void {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    
    if (this.aUser.tenant_id) {
      console.log("mfa component cal");
      this.MfaService.getUserlist(this.aUser.user_id).then(data => {
        this.user = data;
        console.log(this.user);
        this.setDefaultTab();
      });
    }
  }

  setDefaultTab(): void {
    if (this.user.auth_type === 'app') {
      this.selectedTab = 2; // TOTP tab
      this.isReadOnly = true;
      if (this.tabset) {
        this.tabset.selectTab(this.tabset.tabs[2]);
      }
    }  else if (this.user.auth_type === 'email') {
      this.selectedTab = 0; // smstab
      this.isReadOnly = true;
      if (this.tabset) {
        this.tabset.selectTab(this.tabset.tabs[0]);
      }
    } else {
      this.selectedTab = 0; // Default to Email tab
      this.isReadOnly = false;
    }
  }

  onTabChange(event: any): void {
    // handle tab change if necessary
    // this.selectedTab = event.tab.index;
  }

  navigateToLogin() {
    this.router.navigate(['auth/login']);
  }

}


