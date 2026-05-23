import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { MfaService } from './mfa/mfa.service';

@Injectable({
  providedIn: 'root',
})

export class AuthRedirectService {
  user_id: any;
  auser: any;
  constructor(private authService: NbAuthService, private router: Router, private MfaService: MfaService) {
    console.log('AuthRedirectService initialized');
    this.authService.onTokenChange().subscribe((token: NbAuthJWTToken) => {
      if (token.isValid()) {
        this.auser = token.getPayload();
        if (this.auser.is_admin == '1' || this.auser.is_tenant == '1') {
          this.MfaService.getUserlist(this.auser.user_id).then(data => {
            // if MFA allow and not verified user then redirect to verification page
            if(this.auser.mfa_enabled == '1' && data.verify == '0') {
              this.router.navigate(['auth/mfa']);
            }
          });
        }
      }
    });
  }
}
