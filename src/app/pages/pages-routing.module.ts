import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundComponent } from './miscellaneous/not-found/not-found.component';
import { InFaxComponent } from './infax/infax-component';
import { ChangePasswordComponent } from './changepassword/changepassword-component';
import { CDRComponent } from './cdr/cdr.component';
import { CampaignCDRComponent } from './campaign_cdr/campaign_cdr.component';
import { StatisticReportComponent } from './statistic-report/statistic-report.component';
import { FaxSettingsComponent } from './faxsettings/faxsettings-component';
import { BrandingComponent } from './branding/branding-component';
import { Password_PolicyComponent } from './password_policy/password_policy-component';

import { Password_PolicyModule } from './password_policy/password_policy.module';

import { ActivitiesComponent } from './activities/activities.component';

import { AnnouncementComponent } from './announcement/announcement.component';
import { CIDComponent } from './cid/cid.component';
import { IncomingCIDNumberComponent } from './incoming_cid_number/incoming_cid_number.component';
import { UsersCdrComponent } from './users-cdr/users-cdr.component';
import { EditionGuard } from '../edition.guard';
import { EndUserGuard } from '../end-user.guard';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [
    {
      path: 'dashboard',
      component: DashboardComponent,
    },
    {
      path: 'infax',
      component: InFaxComponent
    },
    // {
    //   path: 'tenant',
    //   component: FormsTenantComponent
    // },
    {
      path: 'Changepass',
      component: ChangePasswordComponent
    },
    {
      path: 'announcement',
      component: AnnouncementComponent
    },
    {
      path: 'cdr',
      component: CDRComponent,
    },
    {
      path: 'users-cdr',
      component: UsersCdrComponent,
    },
    {
      path: 'statistic-report',
      component: StatisticReportComponent,
    },
    {
      path: 'faxsettings',
      component: FaxSettingsComponent,
    },
    {
      path: 'cid',
      component: CIDComponent,
    },
    {
      path: 'incoming_cid_number',
      component: IncomingCIDNumberComponent,
    },
    {
      path: 'campaigncdr',
      component: CampaignCDRComponent,
    },
    {
      path: 'branding',
      component: BrandingComponent,
      canActivate: [EditionGuard],
    },
    {
      path: 'password_policy',
      component: Password_PolicyComponent,
    },
    {
      path: 'activities/activities',
      component: ActivitiesComponent
    },
    {
      path: 'miscellaneous',
      loadChildren: () => import('./miscellaneous/miscellaneous.module')
        .then(m => m.MiscellaneousModule),
    },
    {
      path: 'contact',
      loadChildren: () => import('./contact/contact.module')
        .then(m => m.ContactModule),
    },
    {
      path: 'message',
      loadChildren: () => import('./message/message.module')
        .then(m => m.MessageModule),
    },
    {
      path: 'provider',
      loadChildren: () => import('./provider/provider.module')
        .then(m => m.ProviderModule),
    },
    {
      path: 'tenant',
      loadChildren: () => import('./tenant/tenant.module')
        .then(m => m.TenantModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'user',
      loadChildren: () => import('./user/user.module')
        .then(m => m.UserModule),
    },
    {
      path: 'extension',
      loadChildren: () => import('./extension/extension.module')
        .then(m => m.ExtensionModule),
    },
    {
      path: 'campaigns',
      loadChildren: () => import('./campaigns/campaign.module')
        .then(m => m.CampaignModule),
    },
    {
      path: 'campaigns',
      loadChildren: () => import('./campaigns/campaign.module')
        .then(m => m.CampaignModule),
    },
    {
      path: 'sendfax',
      loadChildren: () => import('./sendfax/sendfax.module')
        .then(m => m.SendFaxModule),
    },
    {
      path: 'did',
      loadChildren: () => import('./did/did.module')
        .then(m => m.DIDModule),
    },
    {
      path: 'contact_dnc',
      loadChildren: () => import('./contact_dnc/contact_dnc.module')
        .then(m => m.ContactDNCModule),
    },
    {
      path: 'cid',
      loadChildren: () => import('./cid/cid.module')
        .then(m => m.CIDModule),
    },
    {
      path: 'incoming_number',
      loadChildren: () => import('./incoming_number/incoming_number.module')
        .then(m => m.IncomingNumberModule),
    },
    {
      path: 'incoming_cid_number',
      loadChildren: () => import('./incoming_cid_number/incoming_cid_number.module')
        .then(m => m.IncomingCIDNumberModule),
    },
    {
      path: 'password_policy',
      loadChildren: () => import('./password_policy/password_policy.module')
        .then(m => m.Password_PolicyModule),
    },
    {
      path: 'contact_dnc',
      loadChildren: () => import('./contact_dnc/contact_dnc.module')
        .then(m => m.ContactDNCModule),
    },
    {
      path: 'rate',
      loadChildren: () => import('./rate/rate.module')
        .then(m => m.RateModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'plan',
      loadChildren: () => import('./plan/plan.module')
        .then(m => m.PlanModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'payment',
      loadChildren: () => import('./payment/payment.module')
        .then(m => m.PaymentModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'route',
      loadChildren: () => import('./route/route.module')
        .then(m => m.RouteModule),
    },
    {
      path: 'coverpage',
      loadChildren: () => import('./coverpage/coverpage.module')
        .then(m => m.CoverpageModule),
    },
    {
      path: 'transmission',
      loadChildren: () => import('./transmission/transmission.module')
        .then(m => m.TransmissionModule),
    },
    {
      path: 'ivr',
      loadChildren: () => import('./ivr/ivr.module')
        .then(m => m.IvrModule),
    },
    {
      path: 'agent-dashboard',
      loadChildren: () => import('./agent-dashboard/agent-dashboard.module')
        .then(m => m.AgentDashboardModule),
    },
    {
      path: 'my-account',
      loadChildren: () => import('./my-account/my-account.module')
        .then(m => m.MyAccountModule),
    },
    {
      path: 'ring_groups',
      loadChildren: () => import('./ring_groups/ring_groups.module')
        .then(m => m.RingGroupsModule),
    },
    {
      path: 'fpbx_extension',
      canLoad: [EndUserGuard],
      canActivate: [EndUserGuard],
      loadChildren: () => import('./fpbx_extension/fpbx_extension.module')
        .then(m => m.FpbxExtensionModule),
    },
    {
      path: 'fpbx_cdr',
      loadChildren: () => import('./fpbx_cdr/fpbx_cdr.module')
        .then(m => m.FpbxCdrModule),
    },
    {
      path: 'feature_codes',
      loadChildren: () => import('./feature_codes/feature-codes.module')
        .then(m => m.FeatureCodesModule),
    },
    {
      path: 'devices',
      loadChildren: () => import('./devices/devices.module')
        .then(m => m.DevicesModule),
    },
    {
      path: 'call_queues',
      loadChildren: () => import('./call_queues/call_queues.module')
        .then(m => m.CallQueuesModule),
    },
    {
      path: 'ivr_menus',
      loadChildren: () => import('./ivr_menus/ivr_menus.module')
        .then(m => m.IvrMenusModule),
    },
    {
      path: 'voicemails',
      loadChildren: () => import('./voicemails/voicemails.module')
        .then(m => m.VoicemailsModule),
    },
    {
      path: 'conferences',
      loadChildren: () => import('./conferences/conferences.module')
        .then(m => m.ConferencesModule),
    },
    {
      path: 'time_conditions',
      loadChildren: () => import('./time_conditions/time_conditions.module')
        .then(m => m.TimeConditionsModule),
    },
    {
      path: 'call_flows',
      loadChildren: () => import('./call_flows/call_flows.module')
        .then(m => m.CallFlowsModule),
    },
    {
      path: 'call_block',
      loadChildren: () => import('./call_block/call_block.module')
        .then(m => m.CallBlockModule),
    },
    {
      path: 'follow_me',
      loadChildren: () => import('./follow_me/follow_me.module')
        .then(m => m.FollowMeModule),
    },
    {
      path: 'music_on_hold',
      loadChildren: () => import('./music_on_hold/music_on_hold.module')
        .then(m => m.MusicOnHoldModule),
    },
    {
      path: 'gateways',
      loadChildren: () => import('./gateways/gateways.module')
        .then(m => m.GatewaysModule),
    },
    {
      path: 'inbound_routes',
      loadChildren: () => import('./inbound_routes/inbound_routes.module')
        .then(m => m.InboundRoutesModule),
    },
    {
      path: 'realtime',
      loadChildren: () => import('./realtime/realtime.module')
        .then(m => m.RealtimeModule),
    },
    {
      path: 'messaging',
      loadChildren: () => import('./messaging/messaging.module')
        .then(m => m.MessagingModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'api_keys',
      loadChildren: () => import('./api-keys/api-keys.module')
        .then(m => m.ApiKeysModule),
    },
    {
      path: 'billing-quota',
      loadChildren: () => import('./billing-quota/billing-quota.module')
        .then(m => m.BillingQuotaModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'billing-usage',
      loadChildren: () => import('./billing-usage/billing-usage.module')
        .then(m => m.BillingUsageModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'package',
      loadChildren: () => import('./package/package.module')
        .then(m => m.PackageModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: 'subscription',
      loadChildren: () => import('./subscription/subscription.module')
        .then(m => m.SubscriptionModule),
      canLoad: [EditionGuard],
      canActivate: [EditionGuard],
    },
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full',
    },
    {
      path: '**',
      component: NotFoundComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
