import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';
import { LayoutService } from '../../../@core/utils';
import { map, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { NbAuthJWTToken, NbAuthService } from '@nebular/auth';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BrandingService } from '../../../pages/branding/branding.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { AppService } from '../../../app.service';
import { AUserService } from '../../../pages/user/user.service';
import { InFaxService } from '../../../pages/infax/infax.service';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SessionComponent } from '../../../pages/session.component';
import { PasswordPolicy_Service } from '../../../pages/password_policy/password_policy.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: any;
  private socket: WebSocket;
  status: any;
  private subscription: Subscription
  domain_title: string = 'ICTFax';
  auser: any;
  credit: number = parseFloat(localStorage.getItem('credit') || '0');
  isCommunity = environment.COMMUNITY_EDITION;
  themes = [
    {
      value: 'default',
      name: 'Light',
    },
    {
      value: 'dark',
      name: 'Dark',
    },
    {
      value: 'cosmic',
      name: 'Cosmic',
    },
    {
      value: 'corporate',
      name: 'Corporate',
    },
  ];
  currentTheme = 'default';
  themeLock: string = '';
  userMenu = [{ title: this.translate.instant('general.change_pass'), link: '/pages/Changepass' }, { title: this.translate.instant('general.log_out'), link: 'auth/logout' }];
  image_url = "";
  inbound_faxs: any = 0;
  startTime: Date;
  sessionTime: number = 0;
  ExpiredTime: any;
  is_admin: any;
  is_tenant: any;
  isModelopen: boolean = false;

  constructor(private sidebarService: NbSidebarService,
    private infax: InFaxService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService, private authService: NbAuthService,
    private router: Router, private nbMenuService: NbMenuService,
    private user_service: AUserService,
    private branding_service: BrandingService, public translate: TranslateService,
    private app_service: AppService,
    private modalservice: NgbModal,
    private passwdPolicy: PasswordPolicy_Service) {
    this.startTime = new Date();
    this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken) => {

        if (token.isValid()) {
          this.auser = token.getPayload();
          localStorage.setItem('username', this.auser.username);
          localStorage.setItem('is_admin', this.auser.is_admin);
          localStorage.setItem('is_tenant', this.auser.is_tenant);
          localStorage.setItem('aid', this.auser.user_id);
          localStorage.setItem('tid', this.auser.tenant_id);
          localStorage.setItem('permission', "");
          localStorage.setItem('MFApermission', this.auser.mfa_enabled);
          localStorage.setItem('retention_permission', this.auser.retention_permission);
          if (this.auser.user_permission) localStorage.setItem('permission', this.auser.user_permission);
          localStorage.setItem('credit', this.auser.credit ?? '0');

          this.get_domain_title(this.auser.tenant_id);
        }
        else {
          localStorage.clear();
        }

      });
  }

  ngOnInit() {
    this.socketmessage();
    this.trackUserActivity();
    const savedTheme = localStorage.getItem('theme_pref');
    if (savedTheme) {
      this.themeService.changeTheme(savedTheme);
    }
    this.currentTheme = this.themeService.currentTheme;
    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => this.currentTheme = themeName);

    this.subscription = this.nbMenuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'my-context-menu'),
        map(({ item: { title } }) => title),
      )
      .subscribe(title => {
        if (title == 'Log out') {
          let copy_token = localStorage.getItem('copy_token');
          if (copy_token != null) {
            localStorage.removeItem('copy_token');
            window.location.reload();

            this.authService.getToken()
              .subscribe((token: NbAuthJWTToken,
              ) => {
                if (token && token.getValue()) {
                  let auser = token.getPayload();
                  localStorage.setItem('username', auser.username);
                  localStorage.setItem('is_admin', auser.is_admin);
                }
              });

            this.router.navigate(['/dashboard']);

          }
          else {
            if (localStorage.getItem('MFApermission') == '1') {
              this.auser.verify = 0;
              this.user_service.update_User(this.auser).then(data => {
              });
            }
            this.router.navigate(['auth/logout']);
          }
          setTimeout(function () {
            window.location.reload();
          }, 1000);
        }
      });
  }

  socketmessage() {
    if (!this.app_service.wsUrl) return;
    const user_id = localStorage.getItem('aid');
    this.socket = new WebSocket(this.app_service.wsUrl);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);
      if (message.module == 'user') {
        if (user_id == message['0'].user_id) {
          if (message['0'].status == "logout") {
            sessionStorage.clear();
            localStorage.clear();
            this.router.navigate(['auth/logout']);
            window.location.reload();
          }
        }
      }
    }
    this.socket.onerror = (error) => {
      IntervalObservable.create(5000)
        .subscribe(() => {
          this.getstatus();
          this.InitializeSession();
        });
    }
  }
  trackUserActivity() {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    events.forEach(event =>
      window.addEventListener(event, () => this.resetSession())
    );
  }
  resetSession() {
    this.startTime = new Date();
    if (this.isModelopen) {
      this.sessionTime = 0;
      this.isModelopen = false;
    }
  }

  InitializeSession() {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    this.passwdPolicy.get_Policy().then(response => {
      this.ExpiredTime = response.sessiontime;
    }).catch(error => {
      console.error('Error fetching Sessiontime:', error);
    });
    const currentTime = new Date();
    const diffMs = currentTime.getTime() - this.startTime.getTime();
    this.sessionTime = Math.floor(diffMs / (1000 * 60));
    if (this.sessionTime === Number(this.ExpiredTime) && !this.isModelopen) {
      this.startTime = new Date();
      this.modalservice.open(SessionComponent);
      this.isModelopen = true;
      this.startPopupTimer();
    }
  }
  startPopupTimer() {
    const responseTime = 60 * 1000;
    setTimeout(() => {
      if (this.isModelopen) {
        this.modalservice.dismissAll();
        localStorage.clear();
        this.router.navigate(['auth/logout']);
        window.location.reload();
      }
    }, responseTime);
  }
  getstatus() {
    const is_admin = Number(localStorage.getItem('is_admin'));
    const is_tenant = Number(localStorage.getItem('is_tenant'));
    if (!is_admin && !is_tenant) return;
    this.user_service.get_status(this.auser.user_id).then(response => {
      this.status = response;
    });
    if (this.status == 'logout') {
      localStorage.clear();
      window.location.reload();
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
  }
  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
    localStorage.setItem('theme_pref', themeName);
  }

  private applyFavicon(url: string) {
    if (!url) return;
    let link: HTMLLinkElement = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }
  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();
    return false;
  }
  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }
  ngDoCheck() {
    let myname = localStorage.getItem('username');
    if (myname != undefined) {
      this.auser.username = myname;
    }
    const c = localStorage.getItem('credit');
    if (c !== null) this.credit = parseFloat(c) || 0;
  }
  async get_domain_title(tenant_id) {
    if (environment.COMMUNITY_EDITION) {
      this.image_url = "../../../../assets/images/ictpbx-logo.png";
      return;
    }
    this.branding_service.get_Branding(tenant_id).then(response => {
      document.title = response.title;
      this.domain_title = response.title;
      if (response.title) {
        if (response.logo) {
          this.image_url = `${this.app_service.apiUrlBranding}/${this.auser.tenant_id}/media`;
        } else {
          this.image_url = `${this.app_service.apiUrlBranding}/null/media`;
        }
      }
      this.applyFavicon(response.favicon_url);
      if (response.theme_lock) {
        this.themeLock = response.theme_lock;
        this.themeService.changeTheme(response.theme_lock);
        localStorage.setItem('theme_pref', response.theme_lock);
      }
    }).catch(err => {
      console.log(err);
      this.get_branding();
    });
  }
  get_branding() {
    if (environment.COMMUNITY_EDITION) {
      this.image_url = "../../../../assets/images/ictpbx-logo.png";
      return;
    }
    this.branding_service.get_Branding().then(response => {
      document.title = response.title;
      this.domain_title = response.title;
      if (response.title) {
        this.image_url = `${this.app_service.apiUrlBranding}/null/media`;
      }
      this.applyFavicon(response.favicon_url);
      if (response.theme_lock) {
        this.themeLock = response.theme_lock;
        this.themeService.changeTheme(response.theme_lock);
        localStorage.setItem('theme_pref', response.theme_lock);
      }
    }).catch(err => {
      this.image_url = "../../../../assets/images/ictpbx-logo.png";
    });
  }
}
