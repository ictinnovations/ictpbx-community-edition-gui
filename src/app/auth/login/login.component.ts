/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { NbLoginComponent } from '@nebular/auth';
import { NbAuthService, NB_AUTH_OPTIONS } from '@nebular/auth';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppService } from '../../app.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends NbLoginComponent implements OnInit {

  img = "../../../../assets/images/ictpbx-logo.png";

  isLockedOut: boolean = false;
  maxFailedAttempts: number;
  lockoutMessage: string = '';
  error_message: string = '';
  userLock: string = '';

  loginSubtitle: string = '';
  supportEmail: string = '';
  loginBgUrl: string = '';

  constructor(
    service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) options: {},
    cd: ChangeDetectorRef,
    router: Router,
    private http: HttpClient,
    private app_service: AppService,
  ) {
    super(service, options, cd, router);
  }

  ngOnInit() {
    if (environment.COMMUNITY_EDITION) return;
    const host = window.location.hostname;
    this.http.get(`${this.app_service.apiUrlBrandingPublic}/${encodeURIComponent(host)}`).subscribe(
      (b: any) => {
        if (!b) return;
        if (b.tenant_id) {
          this.img = `${this.app_service.apiUrlBranding}/${b.tenant_id}/media`;
        }
        this.loginSubtitle = b.login_subtitle || '';
        this.supportEmail = b.support_email || '';
        this.loginBgUrl = b.login_bg_url || '';
        if (this.loginBgUrl) {
          document.body.style.backgroundImage = `url('${this.loginBgUrl}')`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
        }
        if (b.favicon_url) {
          let link: HTMLLinkElement = document.querySelector("link[rel*='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = b.favicon_url;
        }
        if (b.title) {
          document.title = b.title;
        }
      },
      () => { /* fall back to defaults */ },
    );
  }

  login() {
    if (this.isLockedOut) {
      return;
    }

    this.errors = [];
    this.messages = [];
    this.submitted = true;

    this.service.authenticate(this.strategy, this.user).subscribe(
      (result) => {
        this.submitted = false;
        if (result.isSuccess()) {
          this.showMessages.success = true;
          this.messages = [result.getMessages().join(', ')];
          this.router.navigate(['/']);
        } else {
          this.attempts(result.getResponse().status);
          this.errors = result.getErrors();
          this.showMessages.error = true;
        }
      },
      (error) => {
        this.submitted = false;
        this.attempts(error.status);
        this.errors = [error.message];
        this.showMessages.error = true;
      }
    );
  }

  attempts(statusCode: number) {
    if (statusCode === 426) {
      this.error_message = "Your password has expired. Please reset you password";
      this.isLockedOut = false;
    } else if (statusCode === 423) {
      this.isLockedOut = true;
      this.lockoutMessage = "Login/Email combination is not correct. Your account has been locked because you have reached the maximum number of invalid sign-in attempts. Please contact to admin";
    } else if (statusCode === 429) {
      this.isLockedOut = true;
      this.userLock = "Your account is locked. Please contact to support.";
    }
  }
}
