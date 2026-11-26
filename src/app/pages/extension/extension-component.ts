import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ExtensionService } from './extension.service';
import { MatSort,  Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ExtensionDatabase } from './extension-database.component';
import { ExtensionDataSource } from './extension-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs/Rx';
import { NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { NbWindowRef } from '@nebular/theme';


import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-extension-component',
  templateUrl: './extension-component.html',
  styleUrls: ['./extension-component.scss'],
})

export class FormsExtensionComponent implements OnInit {
  constructor(private extension_service: ExtensionService, 
  private modalService: NgbModal,
  private windowService : NbWindowService, 
  private translateService : TranslateService,
  private app_service : AppService
) { }

  aExtension: ExtensionDataSource | null;
  length: number;
  closeResult: any;
  private windowRef: NbWindowRef;
  aExtensionArray = [];
  private modalRef: NgbModalRef;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  displayedColumns= ['ID', 'type', 'username', 'phone', 'domain', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    if (this.isAdmin) this.app_service.loadTenants().then(d => this.tenants = d);
    this.getExtensionlist();
  }

  getExtensionlist() {
    this.extension_service.get_ExtensionList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.aExtensionArray = data;
      this.aExtension = new  ExtensionDataSource(new ExtensionDatabase( data ), this.sort, this.paginator);

      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
     .debounceTime(150)
     .distinctUntilChanged()
     .subscribe(() => {
       if (!this.aExtension) { return; }
       this.aExtension.filter = this.filter.nativeElement.value;
      });

      //Sort the data automatically

      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }


  
  deleteExtension(account_id): void {
  this.extension_service.delete_Extension(account_id)
    .then(() => {
      this.aExtensionArray = this.aExtensionArray.filter(
        ext => ext.account_id !== account_id
      );
      this.aExtension = new ExtensionDataSource(
        new ExtensionDatabase(this.aExtensionArray),
        this.sort,
        this.paginator
      );
      this.length = this.aExtensionArray.length;
      this.app_service.success_message = 'Extension has been deleted successfully';
      this.clearMsg();
      this.closeModal();
    })
    .catch(err => {
      try {
        const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
        this.app_service.errors = body?.error?.message || 'Error while deleting Extension';
      } catch { this.app_service.errors = 'Error while deleting Extension'; }
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
  showStaticModal(deleteTemplate,first_name,account_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { first_name : first_name,account_id: account_id } });
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
      return  `with: ${reason}`;
    }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
