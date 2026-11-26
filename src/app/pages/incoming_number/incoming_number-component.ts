import { Component, OnInit, ViewChild } from '@angular/core';
import { IncomingNumberService } from './incoming_number.service';
import { IncomingNumber } from './incoming_number';
import { DataSource } from '@angular/cdk/collections';
import { MatSort  } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';
import { MatSortHeaderIntl } from '@angular/material/sort';
import { IncomingNumberDatabase } from './incoming_number-database.component';
import { IncomingNumberDataSource } from './incoming_number-datasource.component';
import { DIDDatabase } from '../did/did-database.component';
import { DIDDataSource } from '../did/did-datasource.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../modal.component';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { DIDService } from '../did/did.service';
import { AUserService } from '../user/user.service';
import { User } from '../user/user';

@Component({
  selector: 'ngx-incomingnumber-component',
  templateUrl: './incoming_number-component.html',
  styleUrls: ['./incoming_number-component.scss'],
})


export class FormsIncomingNumberComponent implements OnInit {

  auser: any;
  isAdmin = false;
  isTenant = false;

  constructor(private in_number_service: IncomingNumberService,private modalService: NgbModal, private authService: NbAuthService
  , private did_service: DIDService, private user_service: AUserService) {
    this.authService.onTokenChange()
    .subscribe((token: NbAuthJWTToken,
    ) => {
      if (token && token.getValue()) {
        this.auser = token.getPayload();
      }
    });
  }

  aDID: DIDDataSource | null;
  aNumbers: IncomingNumberDataSource | null;
  length: number;
  closeResult: any;
  key: any = '';
  search:any = '';
  data: [];
  users: User[] = [];

  displayedColumns= ['phone', 'first_name', 'assigned_to', 'forward_to', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit() {
    this.isAdmin = localStorage.getItem('is_admin') === '1';
    this.isTenant = localStorage.getItem('is_tenant') === '1';
    if (this.auser.is_admin == 0) {
      this.getIncomingNumberlist();
    } else {
      this.getAllList();
    }
  }

  getIncomingNumberlist() {
    this.in_number_service.get_List(this.auser.user_id).then(data => {
      this.length = data.length;
      this.data = data;
      this.aNumbers = new IncomingNumberDataSource(new IncomingNumberDatabase( data ), this.sort, this.paginator);      this.getUserlist();
      this.getUserlist();
    })
    .catch(this.handleError);
  }

  getAllList(filter = null) {
    this.did_service.get_DIDList(filter).then(response => {
      this.length = response.length;
      this.data = response;
      this.aNumbers = new IncomingNumberDataSource(new IncomingNumberDatabase( response ), this.sort, this.paginator);
      this.getUserlist();
    });
  }
search_IncomingNumber(modal) {
  var filter = '';
  filter += `${this.key}=${this.search}`;
  this.getAllList(filter);
  modal.close();
}

  resetsearch(modal){
    this.getAllList();
    modal.close();
  }
  openSearchModal(searchTemplate_IncomingNumber) {
    const modalRef = this.modalService.open(searchTemplate_IncomingNumber);
    modalRef.result.then(
        (result) => {},
        (reason) => {}
    );
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
        console.log(item);
        
        this.asyncFunction(item, resolve);
      });
    })
  
    Promise.all(requests).then(() => {
      this.aDID = new DIDDataSource(new DIDDatabase( data ), this.sort, this.paginator);
    });
  }

  asyncFunction (item, cb) {
    setTimeout(() => {
      // console.log('done with', item);
      cb();
    }, 300);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
