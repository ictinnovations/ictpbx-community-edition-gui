import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AppService } from '../../app.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Headers, RequestOptions, Http } from '@angular/http';
import { Transmission } from '../transmission/transmission';
import { InFaxService } from './infax.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { InFaxDataSource } from './infax-datasource.component';
import { InFaxDatabase } from './infax-database.component';
import { DocumentService } from '../message/document/document.service';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DocumentProgram } from '../campaigns/campaign';
import { Observable } from 'rxjs/Rx';

import { NbDialogService, NbWindowRef, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { ContactService } from '../contact/contact.service';
import { CompleterData, CompleterItem, CompleterService } from 'ng2-completer';
import { SendFaxService } from '../sendfax/sendfax.service';
import { Contact } from '../contact/contact';
import { DID } from '../did/did';
import { SendFax } from '../sendfax/sendfax';
import { ConfirmationModalComponent } from '../confirmation-modal.component';
import { Tenant } from '../tenant/tenant';
import { TenantService } from '../tenant/tenant.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DIDService } from '../did/did.service';
import { MatDateRangePicker } from '@angular/material/datepicker';
import { AUserService } from '../user/user.service';
import { Faxlogs } from '../sendfax/faxlogs';
import { Faxactivity } from '../sendfax/faxlogs';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/fromEvent';

import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'ngx-infax-component',
  templateUrl: './infax-component.html',
  styleUrls: ['./infax-component.scss'],

})

export class InFaxComponent implements OnInit {

  constructor(private router: Router,
    private infax_service: InFaxService,
    private modalService: NgbModal,
    private user_service: AUserService,
    private document_service: DocumentService,
    public app_service: AppService,
    private contact_service: ContactService,
    private http: Http,
    private windowService: NbWindowService,
    private sendfax_service: SendFaxService,
    private translateService: TranslateService,
    private dialogService: NbDialogService,
    private completerService: CompleterService,
    private fb: FormBuilder,
  ) {
    this.range = this.fb.group({
      start: [null], // Initialize with null or a default value if needed
      end: [null]    // Initialize with null or a default value if needed
    });
  }

  aInFax: InFaxDataSource | null;
  dateFormat: string = 'yyyy-MM-dd HH:mm:ss';
  length: number = 0;
  document_id: any;
  lastpage: number;
  socket: WebSocket;
  infaxArr: SendFax[] = [];

  document: Document = new Document;
  documentProgram: DocumentProgram = new DocumentProgram;
  private modalRef: NgbModalRef;
  private windowRef: NbWindowRef;
  private WindowService: NbWindowService
  faxDocumentURL: string;
  totalPages: number = 0;
  page: number = 1;
  isLoaded: boolean = false;
  notify: any;
  data: any;
  transmission_id: any = null;
  tenantArray: Tenant[] = [];
  trans_id: any;
  sendfax: SendFax = new SendFax;
  dataService: CompleterData;
  contactArray: Contact[] = [];
  accountArray: DID[] = []
  tenant: Tenant = new Tenant;
  did: DID = new DID;
  didArray: DID[] = [];
  tenants: any;
  faxlog: Faxlogs = new Faxlogs;
  faxlogarray: Faxlogs[] = [];
  faxactivity: Faxactivity = new Faxactivity;
  faxactivityarray: Faxactivity[] = [];
  users: any;
  range: FormGroup;
  tenant_id: number = 0;
  pageTenantId: number = 0;
  user_id: number = 0;
  account_id: number = 0;
  is_admin: any = 0;
  is_tenant: any = 0;
  filters = '';
  pageSize = 10;
  pageIndex = 0;
  sendfaxArray: any = [];
  date = '';
  notifier = '';
  read = '0';
  unread = '1';
  search: any = '';
  key: any = '';
  zoom = 1;

  selectedFaxFilter: string;
  displayedColumns = ['ID', 'username', 'phone', 'status', 'Timestamp', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  @ViewChild('picker') picker: MatDateRangePicker<any>;


  ngOnInit() {
    this.app_service.checkFaxProvider();
    this.socketmessage();
    this.getAllUsers();
    this.getInFaxList(10, 0, false, '');
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    if (this.is_admin == 1) this.getAllTenants();
    if (this.is_admin == 0) this.tenant_id = Number(localStorage.getItem('tenant_id'));
    this.getAccountlist();
    this.getdestination();
    this.getAccount_did();
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
        if (message.module == 'sendfax' && message['0'].direction == "inbound" && message['0'].origin == "faxtoemail" && message['0'].service_flag == "2") {
          if (is_admin == '1' || user_id == message['0'].user_id || (is_tenant == '1' && tenant_id == message['0'].tenant_id)) {
            delete message.module;
            const newData: SendFax[] = Object.values(message);
            newData.forEach((newItem) => {
              const index = this.infaxArr.findIndex(item => item.transmission_id == newItem.transmission_id);
              if (index !== -1) {
                this.infaxArr[index] = newItem;
              } else {
                this.infaxArr.push(newItem);
              }
            });
            this.aInFax = new InFaxDataSource(
              new InFaxDatabase(this.infaxArr),
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
  }

  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getInFaxList(event.pageSize, 0, 1)
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
          this.getInFaxList(event.pageSize, pageindex);
        }
      }
    });
  }

  openSearchModal(searchTemplate) {
    const modalRef = this.modalService.open(searchTemplate);
    modalRef.result.then(
      (result) => {
      },
      (reason) => {
      }
    );
  }

  zoomIn() {
  this.zoom = Math.min(3, this.zoom + 0.5);
  console.log(this.zoom)
}

zoomOut() {
  this.zoom = Math.max(0.5, this.zoom - 0.5);
  console.log(this.zoom)
}

  searchUsers(modal) {
    if (this.is_admin == 1) var tenant = 0;
    else tenant = this.aInFax.tenant_id;
    var filter = '';
    filter += `${this.key}=${this.search}`;

    this.infax_service.get_InFaxTransmissionList(tenant, null, filter).then(data => {
      this.paginator.length = data.length;
      this.aInFax = new InFaxDataSource(new InFaxDatabase(data), this.sort, this.paginator);
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
    modal.close();

  }
  clearSearch() {
    this.search = '';
  }


  gettotalrows() {
    this.infax_service.gettotalrows().then(dataa => {
      this.paginator.length = dataa;
    })
  }

  getInFaxList(pagesize = null, pageIndex = null, reget = null, filter = null) {
    const tenantFilter = this.pageTenantId > 0 ? `tenant_id=${this.pageTenantId}` : '';
    const combinedFilter = [filter, tenantFilter].filter(f => f).join('&') || null;
    this.infax_service.get_InFaxTransmissionList(pagesize, pageIndex, combinedFilter).then(data => {
      if (this.filters != '') {
        this.length = data.length;
        this.sendfaxArray = data;
        this.paginator.pageIndex = 0;
        this.paginator.length = data.length;
      } else {
        this.sendfaxArray = this.sendfaxArray.concat(data);
        this.length += data.length;
      }

      if (reget == 1) {
        this.sendfaxArray = data;
        this.length = data.length;
      }

      data.forEach(element => {
        if (element.contact_phone == null) {
          element.contact_phone = 'N/A';
        }
      })

      this.aInFax = new InFaxDataSource(new InFaxDatabase(this.sendfaxArray), this.sort, this.paginator);
      if (this.filters == '' && reget == 0) {
        this.paginator.pageIndex = this.lastpage;
      }
      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if (!this.aInFax) { return; }
          this.aInFax.filter = this.filter.nativeElement.value;
        });
    });
  }

  downloadDocument(transmission_id) {
    this.infax_service.getTransmissionResult(transmission_id).then(response => {
      this.document_id = response[0].data;
      this.document_service.get_Documentdownload(this.document_id);
    });
  }

  getdestination() {
    this.contact_service.get_ContactList().then(data => {
      this.contactArray = data;
    })
  }

  onSelected(item: CompleterItem) {
    console.log(item);
    if (item != null) {
      this.sendfax.contact_id = item.originalObject.contact_id;
    }
    else {
      this.sendfax.contact_id = undefined;
    }
  }


  // Get Confirmation after download finished
  openConfirmationModal(transmission_id): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.title = 'Confirmation';
    modalRef.componentInstance.message = 'Has your FAX been received?';

    modalRef.result.then((result) => {
      // Handle user choice
      if (result === true) {
        alert("Thank you, fax will now be deleted from AireFax.");
        this.infax_service.delete_Transmission(transmission_id);
        this.document_service.delete_Document(this.document_id);
        this.getInFaxList(10, 0, false, '');
      } else {
        alert("Please try a different browser and download again.")
      }
    })
  }


  // Send Fax related Form
  open(content, document_id) {
    this.documentProgram.document_id = document_id;
    this.translateService.get('infax.infax_form.title').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(content, { title: translatedTitle });
    });
  }
  // Show Fax PDF
  // showPDF(pdfViewerTemplate, transmission_id) {
  //   this.translateService.get('fax_viewer.title').subscribe((translatedTitle: string) => {
  //     this.windowRef = this.windowService.open(
  //       pdfViewerTemplate,
  //       {
  //         title: translatedTitle,
  //       },
  //     );
  //     this.viewFaxDocument(transmission_id);
  //   });
  // }
  async showPDF(pdfViewerTemplatete, transmission_id) {
    await this.infax_service.getTransmissionResult(transmission_id).then(response => this.document_id = response[0].data);
    this.translateService.get('fax_viewer.title').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(pdfViewerTemplatete,
        {
          title: translatedTitle,
        },
      );
      this.viewFaxDocument(this.document_id);
    });
  }
  // Load PDF document
  viewFaxDocument(document_id) {
    this.totalPages = 0;
    this.isLoaded = false;
    const url = this.document_service.get_ViewFaxDocument(document_id);
    this.faxDocumentURL = url;
  }
  nextPage() {
    this.page += 1;
  }
  previousPage() {
    this.page -= 1;
  }
  afterLoadComplete(pdfData: any) {
    this.totalPages = pdfData.numPages;
    this.isLoaded = true;
  }
  closeModal() {
    this.modalRef.close();
  }

  onSave() {
    this.modalRef.close();
    this.faxactivityarray = [];
    this.faxlogarray = [];
  }

  popup(content, transmission_id) {
    this.documentProgram.document_id = transmission_id;
    this.modalRef = this.modalService.open(content, { size: 'md' });

    this.modalRef.result.then((result) => {
    });
  }

  addSendDocument(): void {
    if (this.sendfax.contact_id != undefined) {
      this.sendfax.phone = undefined;
    }
    this.sendfax_service.add_senddocument(this.documentProgram).then(response => {
      const program_id = response;
      this.sendfax.program_id = program_id;
      this.AddTransmission();
      this.onSave();
    });
  }

  AddTransmission(): void {
    this.sendfax_service.add_SendFax(this.sendfax).then(response => {
      const transmission_id = response;
      this.trans_id = transmission_id;
      this.AddSend(this.trans_id);
    });
  }


  AddSend(trans_id): void {
    this.sendfax_service.send_transmission(this.trans_id).then(response => {
    });
  }


  async get_ContactData(contact_id) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url5 = `${this.app_service.apiUrlContacts}/${contact_id}`;
    return await this.http.get(url5, options).toPromise().then(response => response.json())
      .catch(err => this.app_service.handleError(err));
  }

  infax_update(transmission_id: number) {
    this.infax_service.update_inbound(transmission_id).then(response => {
      this.sendfaxArray = this.sendfaxArray.map(fax =>
        fax.transmission_id === transmission_id
          ? { ...fax, is_read: 1 }
          : fax
      );
      this.aInFax = new InFaxDataSource(new InFaxDatabase(this.sendfaxArray), this.sort, this.paginator);
      this.paginator.pageIndex = this.pageIndex;
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(1550)
        .distinctUntilChanged()
        .subscribe(() => {
          if (!this.aInFax) { return; }
          this.aInFax.filter = this.filter.nativeElement.value;
        });
    });
  }

  Bulk(bulkView, transmission_id) {
    this.documentProgram.document_id = transmission_id;
    this.modalRef = this.modalService.open(bulkView, { size: 'md' });
    this.modalRef.result.then((result) => {
    });
  }

  getAllTenants() {
    this.user_service.get_TenantList().then(response => {
      this.tenants = response;
    })
  }

  getAllUsers(tenant = 0) {
    this.user_service.get_UserList(tenant).then(response => {
      this.users = response;
    })
  }

  downloadData() {
    this.setFilter();
    if (this.range.value.start && this.range.value.end) {
      this.infax_service.get_Bulkdownload(
        this.filters);
    } else {
      console.error("Please select both start and end dates.");
    }
  }

  setFilter() {
    this.filters = '';

    if (this.range.value.start) {
      const startTimestamp = new Date(this.range.value.start).getTime() / 1000;
      this.filters += `&after=${startTimestamp}`;
      console.log(`From Timestamp: ${startTimestamp}`);
    }

    if (this.range.value.end) {
      const endTimestamp = new Date(this.range.value.end).getTime() / 1000;
      this.filters += `&before=${endTimestamp}`;
      console.log(`To Timestamp: ${endTimestamp}`);
    }

    if (this.tenant_id > 0) {
      this.filters += `&tenant_id=${this.tenant_id}`;
      console.log(`tenant_id=${this.tenant_id}`);
    }

    if (this.user_id > 0) {
      this.filters += `&user_id=${this.user_id}`;
      console.log(`user_id=${this.user_id}`);
    }

    if (this.account_id) {
      this.filters += `&account_id=${this.account_id}`;
      console.log(`Selected DID: ${this.account_id}`);
    }

    if (this.selectedFaxFilter === '1') {

      this.sendfax.is_read = '1';
      this.filters += `&is_read=1`;
      console.log(`Selected Filter: Read`);
    } else if (this.selectedFaxFilter === '0') {
      this.sendfax.is_read = '0';
      this.filters += `&is_read=0`;
      console.log(`Selected Filter: Unread`);
    }
    this.filters += `&origin=faxtoemail&status=completed`;
  }

  onPageTenantChange() {
    this.sendfaxArray = [];
    this.length = 0;
    this.pageIndex = 0;
    this.getInFaxList(this.pageSize, 0, 1);
    this.gettotalrows();
  }

  onTenantSelect(value) {
    if (value != 0) this.tenant_id = value;
    else this.tenant_id = 0;
    this.getAllUsers(this.tenant_id);
  }

  onUserSelect(value) {
    if (value != 0) this.user_id = value;
    else this.user_id = 0;
    this.getAccount_did(this.user_id)
  }
  getAccount_did(user_id = null): any {
    this.infax_service.get_AccountList(user_id).then(response => {
      this.accountArray = response;
    })
  }

  getAccountlist() {
    this.sendfax_service.get_AccountList().then(data => {
      this.accountArray = data;
      this.sendfax.account_id = this.accountArray[this.accountArray.length - 1].account_id;
    })
  }
  showFaxhistory(transmission_id) {
    this.sendfax_service.getfaxlogs(transmission_id).then(response => {
      this.faxlogarray = response;
    });
    this.sendfax_service.getfaxactivity(transmission_id).then(response => {
      this.faxactivityarray = response;
    });
  }
  con(contentt, transmission_id) {
    console.log("THIS IS TRANSMISSION ID SO YOU CAN SEE THAT", this.transmission_id);
    this.showFaxhistory(transmission_id);
    this.modalRef = this.modalService.open(contentt, { size: 'lg' });

    this.modalRef.result.then((result) => {
      // this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }


  onSelectAccount(value) {
    if (value != 0) {
      this.account_id = value;
    }
    else {
      this.account_id = undefined;
    }
  }
}

