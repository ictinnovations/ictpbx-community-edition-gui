import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AUserService } from './user.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { UserDatabase } from './user-database.component';
import { UserDataSource } from './user-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';

import { AppService } from '../../app.service';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from './user';
import { activity } from './activity';

import { PageEvent } from '@angular/material/paginator';
import { get } from 'http';
@Component({
  selector: 'ngx-user-component',
  templateUrl: './user-component.html',
  styleUrls: ['./user-component.scss'],
})

export class FormsUserComponent implements OnInit {

  timerSubscription: any;

  constructor(
    private user_service: AUserService,
    private modalService: NgbModal,
    private authService: NbAuthService,
    private router: Router,
    private translateService: TranslateService,
    private windowService: NbWindowService,
    private app_service: AppService,
    private snackBar: MatSnackBar

  ) {

    this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken,
      ) => {
        if (token && token.getValue()) {
          this.auser = token.getPayload();
        }
      });

  }

  aUser: UserDataSource | null;

  length: number = 0;
  user: User = new User;
  activity: activity = new activity;
  activityarray: activity[] = [];
  loading = true;
  lastpage: number;
  key: any = '';
  search: any = '';
  userArray: User[] = [];
  closeResult: any;
  is_admin: any = 0;
  is_tenant: any = 0;
  refreshData: any;
  refresher: any;
  UserList: any = [];
  private socket: WebSocket;

  private windowRef: NbWindowRef;

  private modalRef: NgbModalRef;

  // User Activity Modal Pagination
  pageSize: number = 10;
  pageIndex = 0;
  startIndex: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  items_page: number[] = [25];
  minimumItems: number = 0;


  isCommunity: boolean = environment.COMMUNITY_EDITION;
  displayedColumns = this.isCommunity
    ? ['ID', 'first_name', 'email', 'status', 'Account_status', 'user_role', 'Operations']
    : ['ID', 'company', 'first_name', 'email', 'status', 'Account_status', 'user_role', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  auser: any;

  ngOnInit() {
    this.loading = true;
    this.is_admin = Number(localStorage.getItem('is_admin'));

    this.is_tenant = Number(localStorage.getItem('is_tenant'));
    if (this.is_admin == 1) { this.getUserlist(0, 10, 1); this.gettotalrows() }
    else {
      this.getUserlist(this.auser.tenant_id, 10, 1);
      this.gettotalrows(this.auser.tenant_id);
    }
    this.socketmessage();
  }

  socketmessage() {
    if (!this.app_service.wsUrl) return;
    const is_admin = localStorage.getItem('is_admin');
    const is_tenant = localStorage.getItem('is_tenant');
    const user_id = localStorage.getItem('aid');
    const tenant_id = localStorage.getItem('tid');
    this.socket = new WebSocket(this.app_service.wsUrl);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.module == 'user') {
        if (is_admin == '1' || user_id == message['0'].user_id || (is_tenant == '1' && tenant_id == message['0'].tenant_id)) {
          delete message.module;
          const newData: User[] = Object.values(message);
          newData.forEach((newItem) => {
            const index = this.userArray.findIndex(item => item.user_id == newItem.user_id);
            if (index !== -1) {
              this.userArray[index] = newItem;
            } else {
              this.userArray.push(newItem);
            }
          });
          this.aUser = new UserDataSource(
            new UserDatabase(this.userArray),
            this.sort,
            this.paginator
          );
          const sortState: Sort = { active: 'ID', direction: 'desc' };
          this.sort.active = sortState.active;
          this.sort.direction = sortState.direction;
          this.sort.sortChange.emit(sortState);
        }
      }
    }
  }


  open(content, userid) {
    this.showActivityModal(userid);

    this.modalRef = this.modalService.open(content, { size: 'lg' });


    this.modalRef.result.then((result) => {
    }, (reason) => {
    });
  }

  onclose() {
    this.windowRef.close({ cleared: true });
    this.activityarray = [];
  }

  showActivityModal(userid) {
    this.loading = true;
    this.user_service.getActivity(userid).then(response => {
      this.activityarray = response;
      this.length = response.length;
      this.paginate(this.pageSize);
      this.loading = false;
    })
      .catch(err => {
        this.handleError(err);
        this.loading = false;
      });
  }

  paginate(page_items: string | number) {
    if (typeof page_items === 'string') {
      if (page_items === 'next') {
        if (this.startIndex + this.pageSize < this.length) {
          this.startIndex += this.pageSize;
        }
      } else if (page_items === 'previous') {
        if (this.startIndex > 0) {
          this.startIndex -= this.pageSize;
        }
      }
    } else {
      this.pageSize = page_items;
      this.startIndex = 0;
    }
    this.currentPage = Math.floor(this.startIndex / this.pageSize) + 1;
    this.totalPages = Math.ceil(this.length / this.pageSize);
    this.minimumItems = Math.min(this.startIndex + this.pageSize, this.length);
  }

  searchUsers(modal) {
    if (this.is_admin == 1) var tenant = 0;
    else tenant = this.auser.tenant_id;
    var filter = '';
    filter += `${this.key}=${this.search}`;
    this.user_service.get_UserList(tenant, null, null, filter).then(data => {
      this.paginator.length = data.length;
      this.aUser = new UserDataSource(new UserDatabase(data), this.sort, this.paginator);
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
    modal.close();
  }

  gettotalrows(tenant_id = 0) {
    this.user_service.gettotalrows(tenant_id).then(data => {
      this.paginator.length = data;
    });
  }

  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (this.pageSize != event.pageSize) {
        this.getUserlist(this.is_admin == 1 ? 0 : this.auser.tenant_id, event.pageSize, 0);
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
          if (this.is_admin == 1) this.getUserlist(0, event.pageSize, pageindex);
          else this.getUserlist(this.auser.tenant_id, event.pageSize, pageindex);
        }
      }
    });
  }

  refreshPageAfterDelay() {
    setTimeout(() => {
      const currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }, 1000);
  }

  resetsearch(modal) {
    this.userArray = [];
    if (this.is_admin == 1) { this.getUserlist(0, 10, 1); this.gettotalrows() }
    else {
      this.getUserlist(this.auser.tenant_id, 10, 1);
      this.gettotalrows(this.auser.tenant_id);
    }
    modal.close();
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

  Toggler($username, $userid, isChecked: boolean, user: any) {
    // Update the user object with the new status
    this.user.active = isChecked ? '1' : '0';
    this.user.user_id = $userid;
    this.Confirmation($username, $userid, user);
  }
  logout(user_id, first_name) {
    this.user_service.logout(user_id)
      .then(response => {
        const message = `${first_name} has been logged out forcefully.`;
        this.snackBar.open(message, 'Dismiss', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        this.refresher = setTimeout(() => {
          this.refreshPageAfterDelay();
        }, 3000);
      })
      .catch(this.handleError);
  }

  UpdateAccount(): void {
    this.user_service.update_User(this.user)
      .then(response => {
        if (response.active == 0) {
          this.app_service.success_message = `${response.username} User has been disabled Successfully`;
          this.userArray.forEach(item => {
            if (item.user_id === response.user_id) {
              item.active = '0';
            }
          });
        } else if (response.active == 1) {
          this.app_service.success_message = `${response.username} User has been Enabled Successfully`;
          this.userArray.forEach(item => {
            if (item.user_id === response.user_id) {
              item.active = '1';
            }
          });
        }
        // Refresh the user list and clear any messages
        // if (this.is_admin == 1) this.getUserlist(0, 0,10);
        // else this.getUserlist(this.auser.tenant_id , 0 , 10);
        this.clearMsg();
      })
      .catch(err => {
        this.app_service.errors = 'Error while deleting User';
        this.clearMsg();
      });
    // if (this.is_admin == 1) this.getUserlist(0, 0,10);
    // else this.getUserlist(this.auser.tenant_id , 0 , 10);
  }

  getUserlist(tenant_id = 0, pageSize = null, pageIndex = null, reget = 0) {
    this.user_service.get_UserList(tenant_id, pageSize, pageIndex).then(data => {
      this.length += data.length;
      this.UserList = this.UserList.concat(data);
      if (reget == 1) {
        this.length = data.length;
        this.UserList = data;
      }
      this.aUser = new UserDataSource(new UserDatabase(this.UserList), this.sort, this.paginator);
      if (reget == 0) {
        this.paginator.pageIndex = this.lastpage;
      }
      //Sort the data automatically

      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);

    });
  }

  deleteUser(user_id): void {
    this.windowRef.close();
    this.user_service.delete_User(user_id)
      .then(response => {
        this.app_service.success_message = 'User has been deleted Successfully';
        this.UserList = this.UserList.filter(item => item.user_id !== user_id);
        this.aUser = new UserDataSource(new UserDatabase(this.UserList), this.sort, this.paginator);
        this.paginator.pageIndex = this.pageIndex;
        this.paginator.pageSize = this.pageSize;
        const sortState: Sort = { active: 'ID', direction: 'desc' };
        this.sort.active = sortState.active;
        this.sort.direction = sortState.direction;
        this.sort.sortChange.emit(sortState);
        this.clearMsg();
      })
      .catch(err => {
        this.app_service.errors = 'Error while deleting User';
        this.clearMsg();
      });
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  Confirmation(name, user_id, user) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });
    activeModal.componentInstance.modalHeader = 'Alert';
    if (this.user.active == 0) {

      activeModal.componentInstance.modalContent = `Are you sure you want to disable ${name}?`;
    } else if (this.user.active == 1) {

      activeModal.componentInstance.modalContent = `Are you sure you want to Enable ${name}?`;
    }
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        user.active = this.user.active;
        this.UpdateAccount();
        // this.refreshPageAfterDelay();
      }
    }, (reason) => {
      this.closeResult = this.getDismissReason(reason);
    });
  }



  sign(user) {
    this.user_service.get_UserToken(user.user_id).then(resp => {
      let abc: any = resp;

      localStorage.removeItem('username');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('is_tenant');
      localStorage.setItem('username', user.username);
      localStorage.setItem('is_admin', user.is_admin);
      localStorage.setItem('is_tenant', user.is_tenant);
      localStorage.setItem('permission', "");
      if (user.user_permission) localStorage.setItem('permission', user.user_permission);

      this.router.navigate(['/dashboard']);
      localStorage.setItem('copy_token', abc.token);

    })
      .catch(err => {
        console.log(err);
      })
  }

  // Modal related
  showStaticModal(deleteTemplate, first_name, user_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { first_name: first_name, user_id: user_id } });
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
  // open(content) {
  //   this.translateService.get('user.user_form.title').subscribe((translatedTitle: string) => {
  //     this.windowRef = this.windowService.open(content, { title: translatedTitle });
  //   }); 
  // }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}