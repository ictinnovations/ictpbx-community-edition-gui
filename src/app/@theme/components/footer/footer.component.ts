import { Component } from '@angular/core';
import { NbAuthJWTToken, NbAuthService } from '@nebular/auth';
import { BrandingService } from '../../../pages/branding/branding.service';
import { Branding } from '../../../pages/branding/branding';
import { User } from '../../../pages/user/user';
import { AUserService } from '../../../pages/user/user.service';
import { environment } from '../../../../environments/environment';

declare var window: any;

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
  <span class="created-by" [innerHTML]="domain_footer"></span>
  `,
})
export class FooterComponent {

  user_id = 1;
  auser: any;
  branding: Branding = new Branding;
  user: User = new User;  
  domain_footer: string = 'Copyrights <a href="https://www.ictinnovations.com" target="_blank">ICT Innovations 2026</a>';

  constructor(private authService: NbAuthService, private branding_service: BrandingService, private user_service: AUserService) {

    this.authService.onTokenChange()
    .subscribe((token: NbAuthJWTToken) => {
      this.auser = token.getPayload();
      if (environment.COMMUNITY_EDITION) return;
      this.get_domain_footer(this.auser.tenant_id);
      // const brand:any = this.get_domain_footer(this.auser.tenant_id);
      // if (!brand) this.get_domain_footer(0);
    });
  }
  get_domain_footer(tenant_id) {
    if (environment.COMMUNITY_EDITION) return;
    this.branding_service.get_Branding(tenant_id).then(response => {
      this.domain_footer = response.footer;
    })
    .catch(err => {
      console.log(err);
      this.get_branding();
    })
  }
  
  // search_branding() {
  //   this.user_service.get_UserData(this.user_id).then(response => {
  //     this.user.tenant_id = response['tenant_id'];
  //     this.get_branding();
  //   });
  // }


  get_branding() {
      this.branding_service.get_Branding().then(response => {
        this.branding.defaultvalue = response.defaultvalue;
        this.domain_footer = response.footer;
    });
  }

}


