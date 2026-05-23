import { Component, OnInit, ViewChild } from '@angular/core';
import { DIDService } from './did.service';
import { DID } from './did';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DIDDatabase } from './did-database.component';
import { DIDDataSource } from './did-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AUserService } from '../user/user.service';
import { User } from '../user/user';
import { NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../app.service';
import { PageEvent } from '@angular/material/paginator';
import { ElementRef } from '@angular/core';

@Component({
  selector: 'ngx-did-component',
  templateUrl: './did-component.html',
  styleUrls: ['./did-component.scss'],
})


export class FormsDIDComponent implements OnInit {
  windowRef: import("@nebular/theme").NbWindowRef<any, any>;
  constructor(private did_service: DIDService, private modalService: NgbModal,
    private user_service: AUserService,
    private windowService: NbWindowService,
    private translateService: TranslateService,
    private app_service: AppService
  ) { }

  aDID: DIDDataSource | null;
  length: number = 0;
  pageSize: any = 10
  pageIndex: any = 0;
  lastpage = 0;
  didArray: any = [];
  closeResult: any;
  key: any = '';
  search: any = '';
  data: any = [];
  is_admin: any = 0;
  users: User[] = [];

  displayedColumns = ['phone', 'first_name', 'assigned_to', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.getDIDlist(null, this.pageSize, this.pageIndex);
    this.gettotalrows();
  }

  gettotalrows() {
    this.did_service.gettotalnumberrows().then(data => {
      this.paginator.length = data;
    });
  }

  ngAfterViewInit() {
    var reget = false;
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getDIDlist(this.filter = null, event.pageSize, 0, 1);
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
          this.getDIDlist(null, event.pageSize, pageindex);
        }
      }
    });
  }

  getDIDlist(filter = null, pageSize = null, pageIndex = null, reget = null) {
    this.filter = filter;
    this.did_service.get_DIDList(filter, pageSize, pageIndex).then(data => {
      this.length += data.length;
      this.data = this.data.concat(data);
      if (reget) {
        this.length = data.length;
        this.data = data;
        this.paginator.pageIndex = 0;
      }
      if (filter) {
        this.length = data.length;
        this.data = data;
        this.paginator.pageIndex = 0;
        this.paginator.length = data.length
      }
      this.getUserlist();
    });
  }

  onclose() {
    this.windowRef.close({ cleared: true });
  }

  openSearchModal(searchTemplate_Did) {
    const modalRef = this.modalService.open(searchTemplate_Did);
    modalRef.result.then(
      (result) => { },
      (reason) => { }
    );
  }

  searchDID(modal) {
    var filter = '';
    filter += `${this.key}=${this.search}`;
    this.getDIDlist(filter);
    modal.close();
  }

  resetsearch(modal) {
    this.getDIDlist(null, this.pageSize, 0, 1);
    modal.close();
  }
  getUserlist() {
    this.user_service.get_UserList().then(response => {
      this.users = response;
      this.getUsername(this.data);
    })
  }

  getUsername(data) {

    let requests = data.map((item) => {
      return new Promise((resolve) => {
        let foundelemet = this.users.find(x => x.user_id === item.created_by);
        item.name = foundelemet ? foundelemet.username : null;
        this.asyncFunction(item, resolve);
      });
    })

    Promise.all(requests).then(() => {
      this.aDID = new DIDDataSource(new DIDDatabase(data), this.sort, this.paginator);
    });
  }

  asyncFunction(item, cb) {
    setTimeout(() => {
      // console.log('done with', item);
      cb();
    }, 300);
  }

  deleteDID(account_id): void {
    this.did_service.delete_DID(account_id)
      .then(response => {
        this.app_service.success_message = 'DID_ID has been deleted Successfully';
        this.clearMsg();
        this.closeModal();
        this.getDIDlist(null, this.pageSize, 0, 1);
        this.gettotalrows();
      })
      .catch(err => {
        try {
          const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
          this.app_service.errors = body?.error?.message || 'Error while deleting DID';
        } catch { this.app_service.errors = 'Error while deleting DID'; }
        this.clearMsg();
        this.closeModal();
      });
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  // Modal related
  showStaticModal(deleteTemplate, account_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { account_id: account_id } });
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
    } else {
      return `with: ${reason}`;
    }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
