
import { NgModule, Component, EventEmitter, ElementRef, Input, Output, OnInit, ViewChild } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { SendFaxService } from './sendfax.service';
import { SendFax } from './sendfax';
import { Response, Http, RequestOptions, Headers } from '@angular/http';
import { CdkTableModule } from '@angular/cdk/table';
import { MatTableModule } from '@angular/material/table';
import { DataSource } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MatSortHeaderIntl } from '@angular/material/sort';
import { SendFaxDatabase } from './sendfax-database.component';
import { SendFaxDataSource } from './sendfax-datasource.component';
import { ContactService } from '../contact/contact.service';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Faxactivity, Faxlogs } from './faxlogs';


import { PageEvent } from '@angular/material/paginator';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/fromEvent';
import { AppService } from '../../app.service';
import { TransmissionService } from '../transmission/transmission.service';
import { DocumentService } from '../message/document/document.service';
import { ModalComponent } from '../../modal.component';
@Component({
  selector: 'ngx-sendfax-component',
  templateUrl: './sendfax-component.html',
  styleUrls: ['./sendfax-component.scss'],
})

export class FormsSendFaxComponent implements OnInit {
  constructor(private sendfax_service: SendFaxService, private modalService: NgbModal,
    private contact_service: ContactService,
    private http: Http,
    private router: Router,
    public app_service: AppService,
    private document_service: DocumentService) { }

  aSendFax: SendFaxDataSource | null;

  faxlog: Faxlogs = new Faxlogs;
  faxlogarray: Faxlogs[] = [];
  faxactivity: Faxactivity = new Faxactivity;
  faxactivityarray: Faxactivity[] = [];
  sendfax: SendFax = new SendFax;
  public length: number = 0;
  private socket: WebSocket;
  sendfaxArray: SendFax[] = []
  sendfaxclear: any = false;
  lastpage: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;
  previousPageSize: number = 10;
  key: any = '';
  search: any = '';
  userArray: SendFax[] = [];
  closeResult: any;
  sendfax_filter: any = '';
  is_admin: any = 0;
  is_tenant: any = 0;
  // refreshData: any;
  refresher: any;
  tenant_id: number = 0;
  adminTenantId: number = 0;
  tenantsList: any[] = [];

  private modalRef: NgbModalRef;
  private timerSubscription: any;

  displayedColumns = ['ID', 'phone', 'Timestamp', 'username', 'title', 'status', 'Operations'];
  dateFormat: string = 'yyyy-MM-dd HH:mm:ss';

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;


  ngAfterViewInit() {
    var reget = false;

    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getFaxlist(event.pageSize, 0, 1, this.filter);
      }
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
      if (event.previousPageIndex == event.pageIndex) {
      }
      else if (event.previousPageIndex < event.pageIndex) {
        var pageweight = event.pageIndex * event.pageSize;
        if (pageweight >= this.length) {
          this.lastpage = event.pageIndex;
          var pageindex = event.pageIndex + 1;
          this.getFaxlist(event.pageSize, pageindex);
        }
      }
    });
  }

  asendfax: any;


  ngOnInit() {
    this.app_service.checkFaxProvider();
    this.gettotalrows();
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    if (this.is_admin == 1) {
      this.app_service.loadTenants().then(d => this.tenantsList = d);
      this.getFaxlist(this.pageSize, this.pageIndex);
      this.gettotalrows();
    } else {
      this.getFaxlist(this.pageSize, this.pageIndex);
      this.gettotalrows(this.asendfax ? this.asendfax.tenant_id : 0);
    }
    var tid = Number(localStorage.getItem('tid'));
    this.socketmessage();
  }

  onAdminTenantChange() {
    this.sendfaxArray = [];
    this.length = 0;
    this.pageIndex = 0;
    this.getFaxlist(this.pageSize, 0);
    this.gettotalrows();
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
        console.log(message)
        if (message.module == 'sendfax' && message['0'].direction == "outbound" && (message['0'].service_flag == "2") && (message['0'].origin == "sendfax")) {
          if (is_admin == '1' || user_id == message['0'].user_id || (is_tenant == '1' && tenant_id == message['0'].tenant_id)) {
            delete message.module;
            const newData: SendFax[] = Object.values(message);
            newData.forEach((newItem) => {
              const index = this.sendfaxArray.findIndex(item => item.transmission_id == newItem.transmission_id);
              if (index !== -1) {
                this.sendfaxArray[index] = newItem;
              } else {
                this.sendfaxArray.push(newItem);
              }
            });
            this.aSendFax = new SendFaxDataSource(
              new SendFaxDatabase(this.sendfaxArray),
              this.sort,
              this.paginator
            );
            const sortState: Sort = { active: 'ID', direction: 'desc' };
            this.sort.active = sortState.active;
            this.sort.direction = sortState.direction;
            this.sort.sortChange.emit(sortState);
          }
        }
      }, 3000);
    }
    this.socket.onerror = (error) => {
      this.refresher = setTimeout(() => {
        this.refreshData();
      }, 7000);
    };
  }

  ngOnDestroy() {
    if (this.timerSubscription != undefined) {
      this.timerSubscription.unsubscribe();
    }
  }

  RetryFax(trans_id): void {
    this.sendfax_service.send_transmission(trans_id).then(response => {
      this.app_service.success_message = 'Transmission Retry successfully';
      this.clearMsg();
    }).catch(error => {
      this.app_service.errors = 'Error while retrying transmission';
      this.clearMsg();
    });
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  Toggler($username, $userid, isChecked: boolean) {
    // Update the user object with the new status
    this.sendfax.active = isChecked ? '1' : '0';
    this.sendfax.user_id = $userid;
    this.Confirmation($username, $userid);
  }
  Confirmation(name, user_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });
    activeModal.componentInstance.modalHeader = 'Alert';
    if (this.sendfax.active == 0) {
      activeModal.componentInstance.modalContent = `Are you sure you want to disable ${name}?`;
    } else if (this.sendfax.active == 1) {
      activeModal.componentInstance.modalContent = `Are you sure you want to Enable ${name}?`;
    }
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        this.refreshPageAfterDelay();
      }
      this.refreshPageAfterDelay();
    }, (reason) => {
      this.closeResult = this.getDismissReason(reason);
    });
  }
  searchsendfax(modal) {
    if (this.is_admin == 1) var tenant = '0';
    else tenant = localStorage.getItem('tid');
    this.sendfax_filter = '';
    this.sendfax_filter += `${this.key}=${this.search}`;
    this.sendfax_service.get_OutFaxTransmissionList(null, null, tenant, this.sendfax_filter).then(data => {
      this.paginator.length = data.length;
      this.aSendFax = new SendFaxDataSource(new SendFaxDatabase(data), this.sort, this.paginator);
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
    modal.close();

  }
  clearSearch() {
    // this.search = '';
  }
  gettotalrows(tenant_id = 0) {
    this.sendfax_service.gettotalnumberrows().then(dataa => {
      this.paginator.length = dataa;
    });
  }


  resetsearch(modal) {
    this.userArray = [];
    if (this.is_admin == 1) { this.getFaxlist(0, 10, 0, null); this.gettotalrows() }
    else {
      this.getFaxlist(this.asendfax.tenant_id, 10, 0, null);
      this.gettotalrows(this.asendfax.tenant_id);
    }
    modal.close();
  }

  openSearchModal(searchTemplate) {
    console.log("function clicking")
    const modalRef = this.modalService.open(searchTemplate);
    modalRef.result.then(
      (result) => {
      },
      (reason) => {
      }
    );
  }


  async getFaxlist(pagesize, pageIndex, reget = 0, filter = null) {
    this.filter = filter;
    this.sendfax_service.get_OutFaxTransmissionList(this.adminTenantId, pagesize, pageIndex, filter).then(data => {
      data.forEach(element => {
        if (element.contact_phone == null) {
          element.contact_phone = 'N/A';
        }
      })
      //Sort the data automatically
      if (filter != null) {
        this.length = data.length;
        this.paginator.length = data.length;
        this.paginator.pageIndex = 0;
        this.sendfaxArray = data;
      } else {
        this.sendfaxArray = this.sendfaxArray.concat(data);
        this.length += data.length;
      }
      if (reget == 1) {
        this.sendfaxArray = data;
        this.length = data.length;
        this.paginator.pageIndex = 0;
      }
      this.aSendFax = new SendFaxDataSource(new SendFaxDatabase(this.sendfaxArray), this.sort, this.paginator);
      if (filter == null && reget == 0) {
        this.paginator.pageIndex = this.lastpage;
      }
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);

      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if ((this.filter.nativeElement.value).length > 0) {
            clearTimeout(this.refresher);
          } else {
            this.refresher = setTimeout(() => {
              // this.refreshData();
            }, 8000);
          }
          if (!this.aSendFax) { return; }
          this.aSendFax.filter = this.filter.nativeElement.value;
        });
    });
  }
  private refreshData(): void {
    if (this.paginator.pageIndex == 0 && !this.sendfax_filter) {
      this.sendfax_service.get_OutFaxTransmissionList(0, this.paginator.pageSize, this.paginator.pageIndex, this.filter).then(data => {
        this.length = data.length;

        data.forEach(element => {
          if (element.contact_phone == null) {
            element.contact_phone = 'N/A';
          }
        });

        this.aSendFax = new SendFaxDataSource(new SendFaxDatabase(data), this.sort, this.paginator);

        // Observable for the filter
        Observable.fromEvent(this.filter.nativeElement, 'keyup')
          .debounceTime(150)
          .distinctUntilChanged()
          .subscribe(() => {
            if (!this.aSendFax) { return; }
            this.aSendFax.filter = this.filter.nativeElement.value;
          });
      });
    }
    this.subscribeToData();

  }

  private subscribeToData(): void {
    this.timerSubscription = Observable.timer(5000).first().subscribe(() => this.refreshData());
  }
  refreshPageAfterDelay() {
    setTimeout(() => {
      const currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }, 1000);
  }

  onSave() {
    this.modalRef.close();
    this.faxactivityarray = [];
    this.faxlogarray = [];
  }

  open(content, transmission_id) {
    this.showFaxhistory(transmission_id);
    this.modalRef = this.modalService.open(content, { size: 'lg' });

    this.modalRef.result.then((result) => {
      // this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  showFaxhistory(transmission_id) {
    this.sendfax_service.getfaxlogs(transmission_id).then(response => {
      this.faxlogarray = response;
      if (this.faxlogarray) {
        this.sendfax_service.getfaxactivity(transmission_id).then(response => {
          this.faxactivityarray = response ?? null;

        });
      }
    });

  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  downloadDocument(document_id, transmission_id) {
    this.document_service.get_Documentdownload(document_id, transmission_id);
  }
  deletedocument(transmission_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });
    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = 'Are you sure you want to delete this fax?';
    activeModal.result.then((result) => {
      if (result === 'yes_click') {
        this.sendfax_service.delete_Document(transmission_id).then(() => {
          this.app_service.success_message = 'Fax deleted successfully';
          this.clearMsg();
          this.refreshPageAfterDelay();
        }).catch(() => {
          this.app_service.errors = 'Error while deleting fax';
          this.clearMsg();
        });
      }
    }, () => { });
  }



}
