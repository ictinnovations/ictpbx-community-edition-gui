import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbAuthModule, NbPasswordAuthStrategy, NbAuthJWTToken, getDeepFromObject } from '@nebular/auth';
import { NbSecurityModule, NbRoleProvider } from '@nebular/security';
import { of as observableOf } from 'rxjs';

import { throwIfAlreadyLoaded } from './module-import-guard';
import {
  AnalyticsService,
  LayoutService,
  PlayerService,
  SeoService,
  StateService,
} from './utils';

import { DashboardService } from '../pages/dashboard/dashboard.service';
import { AppService } from '../app.service';
import { CampaignService } from '../pages/campaigns/campaign.service';
import { ContactService } from '../pages/contact/contact.service';
import { GroupService } from '../pages/contact/group/group.service';
import { ExtensionService } from '../pages/extension/extension.service';
import { DocumentService } from '../pages/message/document/document.service';
import { AUserService } from '../pages/user/user.service';
import { ProviderService } from '../pages/provider/provider.service';
import { environment } from '../../environments/environment';
import { HttpResponse } from '@angular/common/http';
import { InFaxService } from '../pages/infax/infax.service';
import { SendFaxService } from '../pages/sendfax/sendfax.service';
import { IncomingNumberService } from '../pages/incoming_number/incoming_number.service';
import { DIDService } from '../pages/did/did.service';
import { CDRService } from '../pages/cdr/cdr.service';
import { CampaignCDRService } from '../pages/campaign_cdr/campaign_cdr.service';
import { RateService } from '../pages/rate/rate.service';
import { PlanService } from '../pages/plan/plan.service';
import { PaymentService } from '../pages/payment/payment.service';
import { RouteService } from '../pages/route/route.service';
import { AuthGuard } from '../auth-guard.service';
import { TenantService } from '../pages/tenant/tenant.service';
import { SigninService } from '../auth/signin/signin.service';
import { AuthRedirectService } from '../auth/auth-redirect.service';

const socialLinks = [
  {
    url: 'https://github.com/akveo/nebular',
    target: '_blank',
    icon: 'github',
  },
  {
    url: 'https://www.facebook.com/akveo/',
    target: '_blank',
    icon: 'facebook',
  },
  {
    url: 'https://twitter.com/akveo_inc',
    target: '_blank',
    icon: 'twitter',
  },
];

const DATA_SERVICES = [

];

export class NbSimpleRoleProvider extends NbRoleProvider {
  getRole() {
    // here you could provide any role based on any auth flow
    return observableOf('guest');
  }
}
const user_id = localStorage.getItem('aid');
export const NB_CORE_PROVIDERS = [
  ...DATA_SERVICES,
  ...NbAuthModule.forRoot({

    strategies: [
      NbPasswordAuthStrategy.setup({
        name: 'email',
        baseEndpoint: environment.API_URL ,
      requestPass:false,
      logout:{ 
        endpoint:`/authenticate/cancel/${user_id}`,
        method:'post',
        redirect:{
          success:"/authen",
          failure: null,
        },
        requireValidToken:true,
      },
      resetPass:{
        endpoint:"auth/reset",
        redirect:{
          success:"/",
          // failure:"/auth/login"
          failure:"/auth"
        }
      },
      refreshToken:{
        endpoint:'auth/refresh',
        method:"post"
      },
        login: {
          endpoint: '/authenticate',
          method:"post",
          redirect:{
            success: null,
            failure: null,
          },
          requireValidToken:true
        },
        token: {
          class: NbAuthJWTToken,
          key:'token',
          getter: token_to_json 
        }
      }),
    ],
    forms: {
      login: {
        socialLinks: socialLinks,
      },
      register: {
        socialLinks: socialLinks,
      },
    },
  }).providers,

  NbSecurityModule.forRoot({
    accessControl: {
      guest: {
        view: '*',
      },
      user: {
        parent: 'guest',
        create: '*',
        edit: '*',
        remove: '*',
      },
    },
  }).providers,

  {
    provide: NbRoleProvider, useClass: NbSimpleRoleProvider,
  },
  AuthRedirectService,
  AnalyticsService,
  LayoutService,
  PlayerService,
  SeoService,
  StateService,
  DashboardService,
  AppService,
  CampaignService,
  ContactService,
  GroupService,
  ExtensionService,
  DocumentService,
  AUserService,
  ProviderService,
  InFaxService,
  SendFaxService,
  IncomingNumberService,
  DIDService,
  CDRService,
  AuthGuard,
  CampaignCDRService,
  RateService,
  PlanService,
  PaymentService,
  RouteService,
  TenantService,
  SigninService
];

export function token_to_json(module: string, res: HttpResponse<Object>) {
  return getDeepFromObject(res.body, 'token');
}

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
    NbAuthModule,
  ],
  declarations: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  static forRoot(): ModuleWithProviders <CoreModule> {
    return{
      ngModule: CoreModule,
      providers: [
        ...NB_CORE_PROVIDERS,
      ],
    };
  }
}
