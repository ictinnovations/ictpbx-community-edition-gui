import { Component, OnDestroy, OnInit, ViewChild, } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { takeWhile } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import { Router } from '@angular/router';
import { UserDataSource } from '../user/user-datasource.component';
import { TenantDataSource } from '../tenant/tenant-datasource.component';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { DIDDataSource } from '../did/did-datasource.component';
import { SendFaxDataSource } from '../sendfax/sendfax-datasource.component';
import { InFaxDataSource } from '../infax/infax-datasource.component';
import { UserDatabase } from '../user/user-database.component';
import { TenantDatabase } from '../tenant/tenant-database.component';
import { DIDDatabase } from '../did/did-database.component';
import { SendFaxDatabase } from '../sendfax/sendfax-database.component';
import { InFaxDatabase } from '../infax/infax-database.component';
import { AUserService } from '../user/user.service';
import { TenantService } from '../tenant/tenant.service';
import { InFaxService } from '../infax/infax.service';
import { DIDService } from '../did/did.service';
import { AppService } from '../../app.service';
import { SendFaxService } from '../sendfax/sendfax.service';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { MfaService } from '../../auth/mfa/mfa.service';
import { environment } from '../../../environments/environment';

interface CardSettings {
  title: string;
  iconClass: string;
  type: string;
}

@Component({
  selector: 'ngx-dashboard',
  styleUrls: ['./dashboard.component.scss'],
  templateUrl: './dashboard.component.html',


})
export class DashboardComponent implements OnInit, OnDestroy {

  stat: any;
  infax_total: any;
  outfax_total: any;
  user_total: any;
  tenant_total: any;
  did_total: any;
  pbxStats: any = null;
  pbxCardItems: any[] = [];
  daily_limit: any;
  daily_sent: any;
  monthly_limit: any;
  private socket: WebSocket;
  monthly_sent: any;
  user_id: any;
  tenant_id: any;
  cardItems = [];
  selectedCardItems = [];
  savedCardItems: any;
  cardItemsList = {};
  edit_cards = false;
  isCommunity: boolean = environment.COMMUNITY_EDITION;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  aUser: UserDataSource | null;
  user_length: any;
  displayedColumns = ['ID', 'company', 'name', 'email', 'daily', 'monthly'];

  aTenant: TenantDataSource | null;
  tenant_length: any;
  tenant_displayedColumns = ['ID', 'company', 'daily', 'monthly'];

  aDID: DIDDataSource | null;
  did_length: any;
  did_displayedColumns = ['phone', 'first_name', 'company'];

  aSendFax: SendFaxDataSource | null;
  sendfax_length: any;
  senfax_displayedColumns = ['ID', 'phone', 'Timestamp', 'username', 'status'];

  aInFax: InFaxDataSource | null;
  infax_length: any;
  infax_displayedColumns = ['ID', 'phone', 'status', 'Timestamp'];

  public isAdmin = false;
  public isTenant = false;
  public isUser = false;
  credit: number = parseFloat(localStorage.getItem('credit') || '0');
  public outfax = true;
  public infax = false;
  public dids = false;
  public users = false;
  public tenants = false;

  public can_send_fax = false;
  public can_receive_fax = false;
  private alive = true;

  solarValue: number;
  lightCard: CardSettings = {
    title: 'Light',
    iconClass: 'nb-lightbulb',
    type: 'primary',
  };
  rollerShadesCard: CardSettings = {
    title: 'Roller Shades',
    iconClass: 'nb-roller-shades',
    type: 'success',
  };
  wirelessAudioCard: CardSettings = {
    title: 'Wireless Audio',
    iconClass: 'nb-audio',
    type: 'info',
  };
  coffeeMakerCard: CardSettings = {
    title: 'Coffee Maker',
    iconClass: 'nb-coffee-maker',
    type: 'warning',
  };

  statusCards: string;

  commonStatusCardsSet: CardSettings[] = [
    this.lightCard,
    this.rollerShadesCard,
    this.wirelessAudioCard,
    this.coffeeMakerCard,
  ];

  statusCardsByThemes: {
    default: CardSettings[];
    cosmic: CardSettings[];
    corporate: CardSettings[];
    dark: CardSettings[];
  } = {
      default: this.commonStatusCardsSet,
      cosmic: this.commonStatusCardsSet,
      corporate: [
        {
          ...this.lightCard,
          type: 'warning',
        },
        {
          ...this.rollerShadesCard,
          type: 'primary',
        },
        {
          ...this.wirelessAudioCard,
          type: 'danger',
        },
        {
          ...this.coffeeMakerCard,
          type: 'info',
        },
      ],
      dark: this.commonStatusCardsSet,
    };
  dataSource: any;

  constructor(private themeService: NbThemeService, private app_service: AppService, private dashboard_service: DashboardService,
    public router: Router, private user_service: AUserService, private tenant_service: TenantService, private did_service: DIDService, private sendfax_service: SendFaxService,
    private infax_service: InFaxService, private service: NbAuthService, private MfaService: MfaService) {

    this.themeService.getJsTheme()
      .pipe(takeWhile(() => this.alive))
      .subscribe(theme => {
        this.statusCards = this.statusCardsByThemes[theme.name];
      });
  }

  ngOnInit() {
    // Check Permission
    const permission = localStorage.getItem('permission') ? localStorage.getItem('permission') : "null";

    this.user_id = localStorage.getItem("aid");
    this.isAdmin = (localStorage.getItem('is_admin') === "1") ? true : false;
    this.isTenant = (localStorage.getItem('is_tenant') === "1") ? true : false;
    this.isUser = (this.isAdmin == false && this.isTenant == false) ? true : false;

    if (permission.includes("send_fax") || this.isAdmin) {
      this.can_send_fax = true;
      // this.outfax = true;
    }
    if (permission.includes("receive_fax") || this.isAdmin) {
      this.can_receive_fax = true;
      // if (!this.outfax) this.infax = true;
    }

    this.socketmessage();
    if (!this.isUser) this.getStat();
    if (!this.isUser) this.getPbxStat();
    if (!this.isUser && this.can_send_fax) this.getFaxlist(10, 0);
    if (!this.isUser && this.can_receive_fax) this.getInFaxList(10, 0);
    if (this.isAdmin) this.getTenantlist();



    if (!this.isUser) {
      this.MfaService.getUserlist(this.user_id).then(data => {
        // if MFA allow and not verified user then redirect to verification page
        if (localStorage.getItem('MFApermission') == '1' && data.verify == '0') {
          this.router.navigate(['auth/mfa']);
        }
      });
    }
    if (!this.isUser) this.getUserlist(1, 0);
    if (!this.isUser) this.getDIDlist();
  }

  ngOnDestroy() {
    this.alive = false;
  }

  socketmessage() {
    if (!this.app_service.wsUrl) return;
    const is_admin = localStorage.getItem('is_admin');
    const is_tenant = localStorage.getItem('is_tenant');
    const user_id = localStorage.getItem('aid');
    const tenant_id = localStorage.getItem('tid');
    this.socket = new WebSocket(this.app_service.wsUrl);
    this.socket.onmessage = (event) => {
      setTimeout(() => {
        const message = JSON.parse(event.data);
        if (message.module == 'sendfax' && (message['0'].service_flag == "2" || message['0'].service_flag == "8")) {
          if (is_admin == '1' || user_id == message['0'].user_id || (is_tenant == '1' && tenant_id == message['0'].tenant_id)) {
            if (message['0'].direction == "outbound") {
              this.outfax_total++
              this.getWidget();
              this.getDashboardCards();
            }
            else if (message['0'].direction == "inbound") {
              this.infax_total++
              this.getWidget();
              this.getDashboardCards();
            }
          }
        }
      }, 3000);
    }
  }


  getPbxStat(): void {
    this.dashboard_service.get_PbxStatistics().then(response => {
      this.pbxStats = response || {};
      const labels: {key: string, perm: string, title: string, type: string}[] = [
        { key: 'extensions',  perm: 'fpbx_extension', title: 'Extensions',   type: 'primary' },
        { key: 'devices',     perm: 'devices',        title: 'Devices',      type: 'success' },
        { key: 'ring_groups', perm: 'ring_groups',    title: 'Ring Groups',  type: 'info' },
        { key: 'call_queues', perm: 'call_queues',    title: 'Call Queues',  type: 'warning' },
        { key: 'ivr_menus',   perm: 'ivr_menus',      title: 'IVR Menus',    type: 'primary' },
        { key: 'voicemails',  perm: 'voicemails',     title: 'Voicemails',   type: 'success' },
        { key: 'conferences', perm: 'conferences',    title: 'Conferences',  type: 'info' },
        { key: 'gateways',    perm: 'gateways',       title: 'Gateways',     type: 'warning' },
      ];
      const permission = localStorage.getItem('permission') || '';
      const visible = this.isAdmin
        ? labels
        : labels.filter(l => permission.includes(l.perm));
      this.pbxCardItems = visible.map(l => ({
        name: l.key, id: 'pbx_' + l.key, title: l.title, type: l.type,
        total: this.abbreviateNumber(this.pbxStats[l.key] ?? 0),
      }));
    });
  }

  getStat(): void {
    this.dashboard_service.get_Statistics().then(response => {
      console.log(response);
      if (!this.isUser) this.did_total = this.abbreviateNumber(response.did_total);
      if (!this.isUser) this.user_total = this.abbreviateNumber(response.user_total);
      if (this.isAdmin) this.tenant_total = this.abbreviateNumber(response.tenant_total);
      this.outfax_total = this.abbreviateNumber(response.transmission_outbound);
      this.infax_total = this.abbreviateNumber(response.transmission_inbound);
      this.daily_limit = this.abbreviateNumber(response.daily_limit);
      this.daily_sent = this.abbreviateNumber(response.daily_sent);
      this.monthly_limit = this.abbreviateNumber(response.monthly_limit);
      this.monthly_sent = this.abbreviateNumber(response.monthly_sent);
      // Set Dashboard Cards
      this.getWidget();
      this.getDashboardCards();
    });
  }

  getWidget(): void {
    // Set All Card Items
    if (this.isAdmin) {
      this.cardItems = [
        { name: 'outbound_fax', id: 'outfax', title: 'Dashboard.outbound_fax', type: 'primary', total: this.outfax_total },
        { name: 'inbound_fax', id: 'infax', title: 'Dashboard.inbound_fax', type: 'success', total: this.infax_total },
        { name: 'did_total', id: 'dids', title: 'Dashboard.dids', type: 'info', total: this.did_total },
        { name: 'user_total', id: 'users', title: 'Dashboard.users', type: 'warning', total: this.user_total },
      ];
      if (!this.isCommunity) {
        this.cardItems.push(
          { name: 'dialy_sent', id: 'daily', title: 'Dashboard.daily_sent', type: 'success', total: this.daily_sent + '/' + this.daily_limit },
          { name: 'monthly_sent', id: 'monthly', title: 'Dashboard.monthly_sent', type: 'danger', total: this.monthly_sent + '/' + this.monthly_limit },
        );
        this.cardItems.splice(4, 0, { name: 'tenant_total', id: 'tenants', title: 'Dashboard.tenants', type: 'primary', total: this.tenant_total });
      }
    } else if (this.isTenant) {
      this.cardItems = [
        { name: 'outbound_fax', id: 'outfax', title: 'Dashboard.outbound_fax', type: 'primary', total: this.outfax_total },
        { name: 'inbound_fax', id: 'infax', title: 'Dashboard.inbound_fax', type: 'success', total: this.infax_total },
        { name: 'did_total', id: 'dids', title: 'Dashboard.dids', type: 'info', total: this.did_total },
        { name: 'user_total', id: 'users', title: 'Dashboard.users', type: 'warning', total: this.user_total },
      ];
      if (!this.isCommunity) {
        this.cardItems.push(
          { name: 'dialy_sent', id: 'daily', title: 'Dashboard.daily_sent', type: 'success', total: this.daily_sent + '/' + this.daily_limit },
          { name: 'monthly_sent', id: 'monthly', title: 'Dashboard.monthly_sent', type: 'danger', total: this.monthly_sent + '/' + this.monthly_limit },
        );
      }
    } else {
      this.cardItems = [];
      if (!this.isCommunity) {
        this.cardItems.push(
          { name: 'dialy_sent', id: 'daily', title: 'Dashboard.daily_sent', type: 'success', total: this.daily_sent + '/' + this.daily_limit },
          { name: 'monthly_sent', id: 'monthly', title: 'Dashboard.monthly_sent', type: 'danger', total: this.monthly_sent + '/' + this.monthly_limit },
        );
      }

      if (this.can_send_fax) this.cardItems.push({ name: 'outbound_fax', id: 'outfax', title: 'Dashboard.outbound_fax', type: 'primary', total: this.outfax_total });
      if (this.can_receive_fax) this.cardItems.push({ name: 'inbound_fax', id: 'infax', title: 'Dashboard.inbound_fax', type: 'success', total: this.infax_total });
    }
    this.selectedCardItems = this.cardItems;
  }

  getDashboardCards(): void {
    this.dashboard_service.get_DashboardCards(this.user_id).then(response => {
      const cards = response.dashboard_cards;
      if (cards) {
        this.savedCardItems = this.cardItems.filter(card => cards.includes(card.id));
        const sortingCards = cards.split(',');
        this.savedCardItems = this.mapOrder(this.savedCardItems, sortingCards, 'id');
      } else this.savedCardItems = this.cardItems;
    });
  }
  mapOrder(array, order, key) {
    array.sort(function (a, b) {
      var A = a[key], B = b[key];
      if (order.indexOf(A) > order.indexOf(B)) return 1;
      else return -1;
    });
    return array;
  };

  setDashboardCards(): void {
    this.dashboard_service.set_DashboardCards(this.user_id, this.cardItemsList).then(response => {
      // if (response.dashboard_cards) this.savedCardItems = response.dashboard_cards;
      // else this.savedCardItems = this.cardItems;
      // this.savedCardItems = this.cardItems;
      this.getWidget();
    });
  }

  abbreviateNumber(value) {
    var newValue = value;
    if (newValue == null) {
      return 0;
    }
    if (value >= 1000) {
      var suffixes = ["", "k", "m", "b", "t"];
      var suffixNum = Math.floor(("" + value).length / 3);
      let shortValue: any = '';
      for (var precision = 2; precision >= 1; precision--) {
        shortValue = parseFloat((suffixNum != 0 ? (value / Math.pow(1000, suffixNum)) : value).toPrecision(precision));
        var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
        if (dotLessShortValue.length <= 2) { break; }
      }
      if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
      newValue = shortValue + suffixes[suffixNum];
    }
    return newValue;
  }

  getUserlist(pagesize, pageindex) {
    this.user_service.get_UserList(pagesize, pageindex).then(data => {
      this.user_length = data.length;

      this.aUser = new UserDataSource(new UserDatabase(data), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
  }

  getTenantlist() {
    this.tenant_service.get_TenantList().then(data => {
      this.tenant_length = data.length;
      this.aTenant = new TenantDataSource(new TenantDatabase(data), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
  }

  getDIDlist() {
    this.did_service.get_DIDList().then(data => {
      this.did_length = data.length;
      console.log(data);

      this.aDID = new DIDDataSource(new DIDDatabase(data), this.sort, this.paginator);
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }

  getFaxlist(pagesize, pageindex) {
    this.sendfax_service.get_OutFaxTransmissionList(pagesize, pageindex).then(data => {
      this.sendfax_length = data.length;
      data.forEach(element => {
        if (element.contact_phone == null) {
          element.contact_phone = 'N/A';
        }
      })
      this.aSendFax = new SendFaxDataSource(new SendFaxDatabase(data), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
  }

  getInFaxList(pagesize = null, pageIndex = null) {
    this.infax_service.get_InFaxTransmissionList(pagesize, pageIndex).then(data => {
      this.infax_length = data.length;

      data.forEach(element => {
        if (element.contact_phone == null) {
          element.contact_phone = 'N/A';
        }
      })
      this.aInFax = new InFaxDataSource(new InFaxDatabase(data), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }

  doCustomize() {
    this.edit_cards = !this.edit_cards;
  }
  saveCustomize() {
    let cardList = [];
    this.selectedCardItems.map(card => cardList.push(card.id));
    // Sort saved card item array
    if (cardList) {
      this.savedCardItems = this.cardItems.filter(card => cardList.includes(card.id));
      this.savedCardItems = this.mapOrder(this.savedCardItems, cardList, 'id');
      // Save in Database
      this.cardItemsList = { "dashboard_cards": cardList.toString() };
      this.setDashboardCards();
    } else this.savedCardItems = this.cardItems;
    // Reset cards
    this.edit_cards = !this.edit_cards;
    this.selectedCardItems = this.cardItems;
  }

  deleteWidget(i) {
    this.selectedCardItems.splice(i, 1);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.selectedCardItems, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  cardClick(a) {
    const pbxRoutes: {[k: string]: string} = {
      pbx_extensions: '/pages/fpbx_extension/extensions',
      pbx_devices:    '/pages/devices/devices',
      pbx_ring_groups:'/pages/ring_groups/ring_groups',
      pbx_call_queues:'/pages/call_queues/call_queues',
      pbx_ivr_menus:  '/pages/ivr_menus/ivr_menus',
      pbx_voicemails: '/pages/voicemails/voicemails',
      pbx_conferences:'/pages/conferences/conferences',
      pbx_gateways:   '/pages/gateways/gateways',
    };
    if (pbxRoutes[a]) { this.router.navigate([pbxRoutes[a]]); return; }
    if (a == 'infax') {
      this.infax = true;
      this.outfax = false;
      this.dids = false;
      this.users = false;
      this.tenants = false;
    }
    else if (a == 'outfax') {
      this.outfax = true;
      this.infax = false;
      this.dids = false;
      this.users = false;
      this.tenants = false;
    }
    else if (a == 'dids') {
      this.dids = true;
      this.outfax = false;
      this.infax = false;
      this.users = false;
      this.tenants = false;
    }
    else if (a == 'users') {
      this.users = true;
      this.outfax = false;
      this.dids = false;
      this.infax = false;
      this.tenants = false;
    }
    else if (a == 'tenants') {
      this.users = false;
      this.outfax = false;
      this.dids = false;
      this.infax = false;
      this.tenants = true;
    }
  }

  // get_didStat() {
  //   this.dashboard_service.get_didStat().then(res => {
  //     const did_total = this.abbreviateNumber(res.account_total);
  //     this.did_total = did_total;
  //   })
  // }

  // fax_inStat() {
  //   this.dashboard_service.get_inFaxStat().then(res => {
  //     const tr_in = this.abbreviateNumber(res.transmission_inbound);
  //     this.infax_total = tr_in;
  //   })
  // }

  // fax_outStat() {
  //   this.dashboard_service.get_outFaxStat().then(res => {
  //     const tr_out = this.abbreviateNumber(res.transmission_outbound);
  //     this.outfax_total = tr_out;
  //   })
  // }
}