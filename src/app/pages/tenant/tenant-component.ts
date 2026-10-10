import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TenantService } from './tenant.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { TenantDatabase } from './tenant-database.component';
import { TenantDataSource } from './tenant-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppService } from '../../app.service';
import { NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { NbWindowRef } from '@nebular/theme';
import { AUserService } from '../user/user.service';


@Component({
  selector: 'ngx-tenant-component',
  templateUrl: './tenant-component.html',
  styleUrls: ['./tenant-component.scss'],
})

export class FormsTenantComponent implements OnInit {

  aTenant: TenantDataSource | null;
  length: number;
  closeResult: any;
  auser: any;
  key: any = '';
  search: any = '';
  users: any;
  user_id: number;
  tenant_id: number = 0;
  is_admin: any = 0;


  displayedColumns = ['ID', 'company', 'first_name', 'last_name', 'email', 'Operations'];
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('filter', { static: false }) filter: ElementRef;

  constructor(private tenant_service: TenantService, private modalService: NgbModal, private authService: NbAuthService
    , private router: Router, private app_service: AppService, private user_service: AUserService) {
    this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken,
      ) => {
        if (token && token.getValue()) {
          this.auser = token.getPayload();
        }
      });

  }

  ngOnInit(): void {
    this.is_admin = Number(localStorage.getItem('is_admin'));
    this.getTenantlist();
  }
  navigateToReport(tenant_id: number): void {
    this.router.navigate(['/pages/tenant/tenant_report', tenant_id]);
  }
  searchTenant(modal) {
    var filter = '';
    filter += `${this.key}=${this.search}`;
    this.tenant_service.get_TenantList(filter).then(data => {
      this.length = data.length;
      this.aTenant = new TenantDataSource(new TenantDatabase(data), this.sort, this.paginator);
      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
    modal.close();
  }

  openSearchModal(searchTemplate_Tenant) {
    const modalRef = this.modalService.open(searchTemplate_Tenant);
    modalRef.result.then(
      (result) => {
      },
      (reason) => {
      }
    );
  }

  resetsearch(modal) {
    this.getTenantlist();
    modal.close();
  }
  getTenantlist() {
    this.tenant_service.get_TenantList().then(data => {
      this.length = data.length;
      this.aTenant = new TenantDataSource(new TenantDatabase(data), this.sort, this.paginator);

      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);

      // Observable for the filter
      fromEvent(this.filter.nativeElement, 'keyup')
        .pipe(debounceTime(150),
          distinctUntilChanged())
        .subscribe(() => {
          if (!this.aTenant) { return; }
          this.aTenant.filter = this.filter.nativeElement.value;
        });
    });
  }
  getAllUsers(tenant = 0) {
    this.user_service.get_UserList(tenant).then(response => {
      this.users = response;
    })
  }
  onTenantSelect(value) {
    console.log('tenat select button is working ')
    if (value != 0) this.tenant_id = value;
    else this.tenant_id = 0;
    this.getAllUsers(this.tenant_id);
    this.user_id = 0;
  }

  deleteTenant(tenant_id): void {
    this.tenant_service.delete_Tenant(tenant_id)
      .then(response => {
        this.app_service.success_message = 'Tenant has been deleted successfully.';
        this.clearMsg();
        this.getTenantlist();
      })
      .catch(err => {
        this.app_service.errors = 'Error occurred while deleting Tenant';
        this.clearMsg();
      });
  }


  // Modal related
  showStaticModal(name, tenant_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });

    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        this.deleteTenant(tenant_id);
      }
    }, (reason) => {
      this.closeResult = this.getDismissReason(reason);
    });
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
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
