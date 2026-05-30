/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from './@core/utils/analytics.service';
import { SeoService } from './@core/utils/seo.service';
import { AuthRedirectService } from './auth/auth-redirect.service';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {

  constructor(
    private analytics: AnalyticsService,
    private seoService: SeoService,
    public translate: TranslateService,
    private authRedirectService: AuthRedirectService,
    private swUpdate: SwUpdate
  ) {
    translate.addLangs(['english', 'japanies', 'italian']);
    translate.setDefaultLang('english');

    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/english|japanies/) ? browserLang : 'english');
  }

  ngOnInit(): void {
    this.analytics.trackPageViews();
    this.seoService.trackCanonicalChanges();
    this.checkForUpdates();
  }

  private checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.versionUpdates.subscribe(evt => {
      if (evt.type === 'VERSION_READY' &&
          confirm('A new version of ICTPBX is available. Reload now to update?')) {
        document.location.reload();
      }
    });
  }
}
