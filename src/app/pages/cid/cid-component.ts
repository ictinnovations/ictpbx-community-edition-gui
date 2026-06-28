import { Component, OnInit, ViewChild } from '@angular/core';
import { CIDService } from './cid.service';
import { CID } from './cid';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CIDDatabase } from './cid-database.component';
import { CIDDataSource } from './cid-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AUserService } from '../user/user.service';
import { User } from '../user/user';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'ngx-cid-component',
  templateUrl: './cid-component.html',
  styleUrls: ['./cid-component.scss'],
})


export class FormsCIDComponent implements OnInit {
  constructor(private cid_service: CIDService, private modalService: NgbModal, private user_service: AUserService) { }

  aCID: CIDDataSource | null;
  length: number = 0;
  tenant_id = 0;
  is_admin: any = '';
  is_tenant: any = '';
  pageIndex: any = 0;
  pageSize: any = 10
  lastpage = 0;
  closeResult: any;
  data: any = [];

  users: User[] = [];

  displayedColumns = ['phone', 'first_name', 'assigned_to', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;


  ngOnInit() {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    if (this.is_admin == 1) { this.tenant_id = 0; }
    else {
      this.tenant_id = Number(localStorage.getItem('tenant_id'));
    }
    this.getCIDlist(this.pageSize, this.pageIndex);
    this.gettotalrows();
  }


  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getCIDlist(event.pageSize, 0, 1);
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
          this.getCIDlist(event.pageSize, pageindex);
        }
      }
    });
  }
  gettotalrows() {
    this.cid_service.gettotalnumberrows().then(dataa => {
      this.paginator.length = dataa;
    });
  }

  getCIDlist(pageSize = null, pageIndex = null, reget = null) {
    this.cid_service.get_CIDList(pageSize, pageIndex).then(data => {
      this.length += data.length;
      this.data = this.data.concat(data);
      if (reget) {
        this.data = data;
        this.length = data.length;
      }
      this.getUserlist(this.pageSize, this.pageIndex);
    });
  }

  getUserlist(pageSize = null, pageIndex = null) {
    this.user_service.get_UserList(this.tenant_id, pageSize, pageIndex).then(response => {
      this.users = this.users.concat(response);
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
      this.aCID = new CIDDataSource(new CIDDatabase(data), this.sort, this.paginator);
    });
  }

  asyncFunction(item, cb) {
    setTimeout(() => {
      // console.log('done with', item);
      cb();
    }, 300);
  }

  deleteCID(account_id): void {
    this.cid_service.delete_CID(account_id)
      .then(() => {
        this.data = this.data.filter(item => item.account_id !== account_id);
        this.paginator.length = this.paginator.length - 1;
        this.aCID = new CIDDataSource(
          new CIDDatabase(this.data),
          this.sort,
          this.paginator
        );

      })
      .catch(this.handleError);
  }



  // Modal related
  showStaticModal(name, account_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });

    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        this.deleteCID(account_id);
      }
    }, (reason) => {
      this.closeResult = this.getDismissReason(reason);
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

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
