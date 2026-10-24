import { NgModule } from '@angular/core';
import { NbAlertModule, NbMenuModule } from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { PagesRoutingModule } from './pages-routing.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { InFaxModule } from './infax/infax.module';
import { ChangePasswordModule } from './changepassword/changepassword.module';
import { CDRModule } from './cdr/cdr.module';
import { CampaignCDRModule } from './campaign_cdr/campaign_cdr.module';
import { FaxSettingsModule } from './faxsettings/faxsettings.module';

import { TenantModule } from './tenant/tenant.module';
import { BrandingModule } from './branding/branding.module';
import { IncomingCIDNumberModule } from './incoming_cid_number/incoming_cid_number.module';

import { Password_PolicyModule } from './password_policy/password_policy.module';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { MatIconModule } from '@angular/material/icon';
import { NbIconModule } from '@nebular/theme';
import { AnnouncementComponent } from './announcement/announcement.component';
import { AnnouncementModule } from './announcement/announcement.module';

import { ActivitiesModule } from '../pages/activities/activities.module';
import { StatisticReportModule } from './statistic-report/statistic-report.module';
import { UsersCdrModule } from './users-cdr/users-cdr.module';


@NgModule({
  imports: [
    PagesRoutingModule,
    ThemeModule,
    NbMenuModule,
    MatIconModule,
    NbEvaIconsModule,
    NbAlertModule,
    AnnouncementModule,
    NbIconModule,
    DashboardModule,
    InFaxModule,
    ChangePasswordModule,
    CDRModule,
    StatisticReportModule,
    MiscellaneousModule,
    CampaignCDRModule,
    FaxSettingsModule,
    TenantModule,
    ActivitiesModule,
    BrandingModule,
    Password_PolicyModule,
    BrandingModule,
    IncomingCIDNumberModule,
    UsersCdrModule,
    // NodeModule,
  ],
  declarations: [
    PagesComponent
  ]
})
export class PagesModule {
}