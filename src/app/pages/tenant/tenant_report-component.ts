import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TenantService } from './tenant.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { TenantDatabase } from './tenant-database.component';
import { TenantDataSource } from './tenant-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeWhile } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { NbThemeService, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { NbWindowRef } from '@nebular/theme';
import { AUserService } from '../user/user.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { InFaxDataSource } from '../infax/infax-datasource.component';
import { SendFaxDataSource } from '../sendfax/sendfax-datasource.component';
import { DIDDataSource } from '../did/did-datasource.component';
import { UserDataSource } from '../user/user-datasource.component';
import { InFaxDatabase } from '../infax/infax-database.component';
import { SendFaxDatabase } from '../sendfax/sendfax-database.component';
import { DIDDatabase } from '../did/did-database.component';
import { InFaxService } from '../infax/infax.service';
import { DIDService } from '../did/did.service';
import { SendFaxService } from '../sendfax/sendfax.service';
import { UserDatabase } from '../user/user-database.component';
import { AppService } from '../../app.service';

interface CardSettings {
  title: string;
  iconClass: string;
  type: string;
}


@Component({
  selector: 'ngx-tenant_report-component',
  templateUrl: './tenant_report-component.html',
  styleUrls: ['./tenant_report-component.scss'],
})

export class TenantReportComponent implements OnInit {

  aTenant: TenantDataSource | null;
  length: number;
  closeResult: any;
  auser: any;
  user:any;
  user_id:any;
  tenant_id: number = 0;
  edit_cards = false;

  stat: any;
  infax_total: any;
  outfax_total: any;
  user_total: any;
  tenant_total: any;
  did_total:any;
  daily_limit: any;
  daily_sent: any;
  monthly_limit: any;
  monthly_sent: any;

  cardItems = [];
  selectedCardItems = [];
  savedCardItems: any;
  cardItemsList = {};

  public isAdmin = false;
  public isTenant = false;
  public isUser = false;
  public outfax = false;
  public infax = false;
  public dids = false;
  public users = true;
  public tenants = false;

  private alive = true;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;


  aDID: DIDDataSource | null;
  did_length: any;
  did_displayedColumns= ['phone', 'first_name', 'company'];

  aSendFax: SendFaxDataSource | null;
  sendfax_length: any;
  senfax_displayedColumns= ['ID', 'phone', 'Timestamp', 'username', 'status'];

  aInFax: InFaxDataSource | null;
  infax_length: any;
  infax_displayedColumns= ['ID', 'phone', 'status', 'Timestamp'];

  private windowRef: NbWindowRef;
  private modalRef: NgbModalRef;
  aUser: UserDataSource | null;
  user_length: any;

  displayedColumns= ['ID', 'first_name', 'last_name', 'total_send','total_inbound','roles','Operations'];


  @ViewChild('filter', {static: false}) filter: ElementRef;
  value: any;

  constructor(private tenant_service: TenantService, 
  private modalService: NgbModal, 
  private authService: NbAuthService,
  private windowService : NbWindowService, 
  private translateService : TranslateService,
  private router: Router,
  private route: ActivatedRoute,
  private user_service: AUserService,
  private dashboard_service : DashboardService,
  private themeService: NbThemeService,
  private infax_service : InFaxService,
  private did_service : DIDService,
  private sendfax_service : SendFaxService,
  private app_service : AppService

) {
  
      this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken,
      ) => {
        if (token && token.getValue()) {
          this.auser = token.getPayload();
        }
      });

      this.themeService.getJsTheme()
      .pipe(takeWhile(() => this.alive))
      .subscribe(theme => {
        this.statusCards = this.statusCardsByThemes[theme.name];
    });
  
    }

    ngOnInit(): void {
      this.route.paramMap.subscribe(params => {
        this.tenant_id = +params.get('id');
        this.getAllUsers(this.tenant_id); 
        console.log('printing the users',this.getAllUsers);

        this.user_id = localStorage.getItem("aid");
        this.isAdmin = (localStorage.getItem('is_admin') === "1") ? true : false;
        this.isTenant = (localStorage.getItem('is_tenant') === "1") ? true : false;
        this.isUser = (this.isAdmin == false && this.isTenant == false) ? true : false

        this.getFaxlist();
        this.getInFaxList();
        this.getDIDlist(this.tenant_id);
        this.getStatForTenant(this.tenant_id)

      });
    }



  // getAllsers(tenant_id: number) {
  //   this.user_service.get_UserList(tenant_id).then(data => {
  //     console.log('sfjhsdjjssssssssssss', data)
  //     this.length = data.length;
  //     // this.aUser = new UserDataSource(new UserDatabase( data ), this.sort, this.paginator);

  //     // const sortState: Sort = {active: 'ID', direction: 'desc'};
  //     // this.sort.active = sortState.active;
  //     // this.sort.direction = sortState.direction;
  //     // this.sort.sortChange.emit(sortState);

  //     // Observable for the filter
  //     fromEvent(this.filter.nativeElement, 'keyup')
  //     .pipe(debounceTime(150),
  //     distinctUntilChanged())
  //    .subscribe(() => {
  //      if (!this.aUser) { return; }
  //      this.aUser.filter = this.filter.nativeElement.value;
  //     });
  //   });
  // }


  getAllUsers(tenant_id: number) {  
    this.user_service.get_list(tenant_id).then(response => {
      console.log("fhjsdhfjsdhfjhsjdfh", response)
      this.user = response;
    }).catch(error => {
      console.error('Error fetching users:', error);
    });
  }
  onTenantSelect(value: number) {
    if (value !== 0) {
      this.tenant_id = value;
    } else {
      this.tenant_id = 0;
    }
    this.getAllUsers(this.tenant_id); 
    this.user_id = 0;                   
    this.getStatForTenant(this.tenant_id);
  }
  deleteUser(user_id): void {
    this.closeModal();
    this.user_service.delete_User(user_id)
    .then(response => {
      this.app_service.success_message = 'User has been deleted successfully.';
      this.clearMsg();
      this.getAllUsers(this.tenant_id);
    })
    .catch(err => {
      this.app_service.errors = 'Error occurred while deleting User';
      this.clearMsg();
  });
  }
  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  // Modal related
  showStaticModal(deleteTemplate,first_name,user_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { first_name : first_name,user_id: user_id } });
    }); 
  }
  closeModal() {
    this.windowRef.close();
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    }
    // else {
    //   return  with:`${reason}`;
    // }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
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

  ngOnDestroy() {
    this.alive = false;
  }

  getStatForTenant(tenant_id : number) {
    this.tenant_service.get_TenantCard(tenant_id).then(response => {
      console.log('hhhhhhhhhhhhhhhhhhhhhhh',response);
      this.outfax_total = this.abbreviateNumber(response.transmission_outbound);
      this.infax_total = this.abbreviateNumber(response.transmission_inbound);
      this.did_total = this.abbreviateNumber(response.did_total);
      this.user_total = this.abbreviateNumber(response.user_total);

      // Set Dashboard Cards
      this.getWidget();
      this.getDashboardCards();
    }).catch(error => {
      console.error('Error fetching statistics:', error);
    });
  }

  getWidget(): void{
      this.cardItems = [
        {name: 'outbound_fax',  id: 'outfax',   title: 'Dashboard.outbound_fax',  type: 'primary',  total: this.outfax_total },
        {name: 'inbound_fax',   id: 'infax',    title: 'Dashboard.inbound_fax',   type: 'success',  total: this.infax_total  },
        {name: 'did_total',     id: 'dids',     title: 'Dashboard.dids',          type: 'info',     total:this.did_total },
        {name: 'user_total',    id: 'users',    title: 'Dashboard.users',         type: 'warning',  total: this.user_total },
      ];

  }

  getDashboardCards(): void {
    this.dashboard_service.get_DashboardCards(this.user_id).then(response => {
      const cards = response.dashboard_cards;
      if (cards) {
        this.savedCardItems = this.cardItems.filter(card => cards.includes(card.id));
        const sortingCards = cards.split(',');
        this.savedCardItems = this.mapOrder(this.savedCardItems, sortingCards, 'id');
      } else {
        this.savedCardItems = this.cardItems;
      }
    }).catch(error => {
      console.error('Error fetching dashboard cards:', error);
    });
  }
  mapOrder(array, order, key) {
    array.sort( function (a, b) {
      var A = a[key], B = b[key];
      if (order.indexOf(A) > order.indexOf(B)) return 1;
      else return -1;
    });
    return array;
  };

  setDashboardCards():void {
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
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        let shortValue :any = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
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
      this.cardItemsList = {"dashboard_cards": cardList.toString()};
      this.setDashboardCards();
    } else this.savedCardItems = this.cardItems;
    // Reset cards
    this.edit_cards = !this.edit_cards;
    this.selectedCardItems = this.cardItems;
  }

  deleteWidget(i) {
    this.selectedCardItems.splice(i,1);
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



  getDIDlist(tenant_id) {
    this.did_service.get_didList(tenant_id).then(data => {
      this.did_length = data.length;
      this.aDID = new  DIDDataSource(new DIDDatabase( data ), this.sort, this.paginator);
    });
  }

  getFaxlist() {
    this.sendfax_service.get_OutFaxtransmissionList_tr(this.tenant_id).then(data => {
      this.sendfax_length = data.length;

      data.forEach(element => {
        if (element.contact_phone == null) {
          element.contact_phone = 'N/A';
        }
      })
      this.aSendFax = new SendFaxDataSource(new SendFaxDatabase( data ), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
  }

  getInFaxList() {
    this.infax_service.get_InFaxTransmissionList_tr(this.tenant_id).then(data => {
      this.infax_length = data.length;

      data.forEach(element => {
        if (element.contact_phone == null) {
          element.contact_phone = 'N/A';
        }
      })

      this.aInFax = new InFaxDataSource(new InFaxDatabase( data ), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }

  cardClick(a) {
    if (a == 'users') {
      this.users = true;
      this.outfax = false;
      this.dids = false;
      this.infax = false;
    }
    else if (a == 'outfax') {
      this.outfax = true;
      this.infax = false;
      this.dids = false;
      this.users = false;
    }
    else if (a == 'dids') {
      this.dids = true;
      this.outfax = false;
      this.infax = false;
      this.users = false;
    }
    else if (a == 'infax') {
      this.infax = true;
      this.outfax = false;
      this.dids = false;
      this.users = false;
    }
  }

}
