import { Component } from '@angular/core';

import { MENU_ITEMS, tenantMenuItems, userMenuItems } from './pages-menu';

import { AppService } from '../app.service';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { MenuItem } from './menu-item';
import { Announcement } from './announcement/announcement';
import { AnnnouncementService } from './announcement/annnouncement.service';
import { InFaxService } from './infax/infax.service';
import { environment } from '../../environments/environment';
@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
  <ngx-one-column-layout>
  <nb-menu [items]="menu" [autoCollapse]="true"></nb-menu>
  <router-outlet>
    <div *ngIf="err_val && err_val.length > 0" class="alert alert-danger" role="alert" style="text-align:center">
      <div><strong>Oh snap!</strong></div>
      <div>{{ err_val }}</div>
    </div>

    <div *ngIf="messg_val && messg_val.length > 0" class="alert alert-success" role="alert">
      <div><strong>Hooray!</strong></div>
      <div>{{ messg_val }}</div>
    </div>

    <div *ngIf="info_val && info_val.length > 0" class="alert alert-danger" role="alert">
      <div>{{ info_val }}</div>
    </div>

     <div *ngIf="info_msg_val && info_msg_val.length > 0" class="alert alert-danger" role="alert">
      <div>{{ info_msg_val }}</div>
    </div>

    <div class="alert-btn">
      <button 
        class="btn btn-primary m-3" 
        (click)="alerton()" 
        [disabled]="!(announcement && announcement.message && announcement.message.length > 0)">
        <mat-icon><nb-icon icon="alert-circle-outline"></nb-icon></mat-icon> Alert
      </button>
    </div>

    <nb-card class="announcement m-2 header-container" *ngIf="content && announcement.message && announcement.message.length > 0">
      <nb-card-header class="alertheader d-flex justify-content-between align-items-center header-container">
        <button type="button" class="close btn col-md-1" aria-label="Close" (click)="alertoff()">
          <b aria-hidden="true">&times;</b>
        </button>
        <b>{{announcement.title}}</b>
      </nb-card-header>
      <div class="alert-message container">
        <nb-card-body>
          <p class="mt-4 col-md-12 pmsg">
            {{announcement.message}}
          </p>
        </nb-card-body>
      </div>
    </nb-card>
  </router-outlet>
</ngx-one-column-layout>
  `,
})
export class PagesComponent {

  menu = MENU_ITEMS;
  err_val: string;
  content: any = true;

  private _lastIsAdmin = -1;
  private _lastIsTenant = -1;
  private _lastPermission = '';
  socket: WebSocket;
  messg_val: string;
  info_msg_val: string;
  announcement : Announcement = new Announcement;
  info_val: string;
  auser: any;

  constructor(private app_service: AppService,private infax_service: InFaxService,private announcementservice: AnnnouncementService, private authService: NbAuthService, private translate: TranslateService) {
    /*
    this.authService.onTokenChange()
    .subscribe((token: NbAuthJWTToken,
    ) => {
      if (token && token.getValue()) {
        this.auser = token.getPayload();
        if (this.auser.is_admin == 0) {
          this.menu = userMenuItems;
        }
      }
    });
    */
  }

  ngOnInit() {
    this.err_val = this.app_service.errors;
    this.info_val = this.app_service.INFO;
    this.info_msg_val = this.app_service.info_message;
    this.notification();
    this.getannouncement();
    this.err_val = this.app_service.errors;
    this.messg_val = this.app_service.success_message;
    this.translateMenu();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => { //Live reload
      this.translateMenu();
    });
  }
  notification(){
    const is_admin = localStorage.getItem('is_admin');
    const is_tenant = localStorage.getItem('is_tenant');
    const user_id = localStorage.getItem('aid');
    const tenant_id = localStorage.getItem('tid');
    if (is_admin === '1' || is_tenant === '1') this.new_getinfax();
    if (!this.app_service.wsUrl) return;
    this.socket = new WebSocket(this.app_service.wsUrl);
    this.socket.onmessage = (event) => {
     const message = JSON.parse(event.data);
     switch(message.module){
       case 'sendfax' :
        if(message.module == 'sendfax' && message['0'].direction == "inbound" && message['0'].origin == "faxtoemail" && message['0'].service_flag == "2" && message['0'].is_read == '0'){
          if(is_admin == '1'|| user_id == message['0'].user_id || (is_tenant == '1' &&  tenant_id == message['0'].tenant_id )){
            const menuItem = this.menu.find(item => item.key === 'receive_fax');
            if (menuItem) {
              menuItem.badge = {
                text: 'New Fax', 
                status: 'danger',
              };
            }
          }
        }
        break;
     }
    };
  }
  new_getinfax(){
    this.infax_service.get_unread_infaxTransmissionList().then(data => {
      const hasUnread = data.some(item => item.is_read === "0");
      if (hasUnread) {
        const menuItem = this.menu.find(menuItem => menuItem.key === 'receive_fax');
        if (menuItem) {
          menuItem.badge = {
            text: 'New Fax', 
            status: 'danger',
          };
        }
      }
    });
  }
  getannouncement(){
    const tenantid = localStorage.getItem('tid');
    this.announcementservice.getannouncement(tenantid).then( data => {
    this.announcement = data;
    });
  }
  alertoff(){
    this.content=false;
  }
  alerton(){
    this.content=true;
  }

  ngDoCheck() {
    this.err_val = this.app_service.errors;
    this.messg_val = this.app_service.success_message;
    this.info_val = this.app_service.INFO;

    const is_admin = Number(localStorage.getItem('is_admin'));
    const is_tenant = Number(localStorage.getItem('is_tenant'));
    const permission = localStorage.getItem('permission') || '';
    const permTokens = permission ? permission.split(',').map((s: string) => s.trim()) : [];

    if (is_admin === this._lastIsAdmin && is_tenant === this._lastIsTenant && permission === this._lastPermission) {
      return;
    }

    this._lastIsAdmin = is_admin;
    this._lastIsTenant = is_tenant;
    this._lastPermission = permission;

    if (environment.COMMUNITY_EDITION && (is_admin == 1 || is_tenant == 1)) {
      this.menu = MENU_ITEMS;
    } else if (is_admin == 1) {
      this.menu = MENU_ITEMS;
    } else if (is_tenant == 1) {
      const tenantAlwaysShow = ['dashboard', 'user', 'administration', 'billing', 'incoming_number', 'my_cids', 'cdr_reports', 'activities'];
      const filterTenantItem = (item: MenuItem): MenuItem | null => {
        if (tenantAlwaysShow.includes(item.key)) return item;
        if (item.children) {
          const visibleChildren = item.children
            .map(c => filterTenantItem(c))
            .filter(Boolean) as MenuItem[];
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }
        return permTokens.includes(item.key) ? item : null;
      };
      this.menu = tenantMenuItems.map(filterTenantItem).filter(Boolean) as MenuItem[];
    } else {
      const alwaysShow = environment.COMMUNITY_EDITION
        ? ['dashboard', 'my_account']
        : ['dashboard', 'my_account', 'billing', 'billing_quota', 'billing_usage', 'incoming_number', 'my_cids'];

      const filterItem = (item: MenuItem): MenuItem | null => {
        if (alwaysShow.includes(item.key)) return item;
        if (item.children) {
          const visibleChildren = item.children
            .map(c => filterItem(c))
            .filter(Boolean) as MenuItem[];
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }
        return permTokens.includes(item.key) ? item : null;
      };

      this.menu = userMenuItems.map(filterItem).filter(Boolean) as MenuItem[];
    }
    this.translateMenu();
  }
    
    // let mymenu:any = localStorage.getItem('is_admin');
    // if (mymenu != undefined && (mymenu == '0' || mymenu == 0) ) {
    //   this.menu = userMenuItems;
    // }
    // else if (mymenu != undefined && (mymenu == '1' || mymenu == 1)) {
    //   this.menu = MENU_ITEMS;
    // }
    // else {
    // }
  

 
  private translateMenu(): void {
    this.menu.forEach((menuItem: MenuItem) => {
      this.translateMenuTitle(menuItem);
    });
  }

  /**
     * Translates one root menu item and every nested children
     * @param menuItem
     * @param prefix
     */
    private translateMenuTitle(menuItem: MenuItem, prefix: string = ''): void {
      
      let key = '';
      try {
        key = (prefix !== '')
        ? PagesComponent.getMenuItemKey(menuItem, prefix)
        : PagesComponent.getMenuItemKey(menuItem);
      }
      catch (e) {
          //Key not found, don't change the menu item
          return;
      }

      this.translate.get(key).subscribe((translation: string) => {
          menuItem.title = translation;
      });
      if (menuItem.children != null) {
          //apply same on every child
          menuItem.children.forEach((childMenuItem: MenuItem) => {
              //We remove the nested key and then use it as prefix for every child
              this.translateMenuTitle(childMenuItem, PagesComponent.trimLastSelector(key));
          });
      }
  }

  /**
   * Resolves the translation key for a menu item. The prefix must be supplied for every child menu item
   * @param menuItem
   * @param prefix
   * @returns {string}
   */
  private static getMenuItemKey(menuItem: MenuItem, prefix: string = 'menu'): string {
      if (menuItem.key == null) {
          throw new Error('Key not found');
      }

      const key = menuItem.key.toLowerCase();
      if (menuItem.children != null) {
          return prefix + '.' + key + '.' + key; //Translation is nested
      }
      return prefix + '.' + key;
  }

  /**
   * Used to remove the nested key for translations
   * @param key
   * @returns {string}
   */
  private static trimLastSelector(key: string): string {
      const keyParts = key.split('.');
      keyParts.pop();
      return keyParts.join('.');
  }

}
