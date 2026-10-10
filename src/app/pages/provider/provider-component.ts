import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ProviderService } from './provider.service';
import { MatSort , Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator'; 
import { ProviderDatabase } from './provider-database.component';
import { ProviderDataSource } from './provider-datasource.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../modal.component';
import { Observable } from 'rxjs/Rx';
import { NbWindowRef, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-provider-component',
  templateUrl: './provider-component.html',
  styleUrls: ['./provider-component.scss'],
})


export class FormsProviderComponent implements OnInit {
  constructor(private provider_service: ProviderService, 
    private modalService: NgbModal,
    private translateService: TranslateService, 
    private windowService: NbWindowService,
    private app_service : AppService
  ) { }

  aProvider: ProviderDataSource | null;
  length: number;
  closeResult: any;
  private windowRef: NbWindowRef;


  displayedColumns= ['ID', 'Name', 'host', 'type', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    this.getProviderlist();
  }

  getProviderlist() {
    this.provider_service.get_ProviderList().then(data => {
      this.length = data.length;
      this.aProvider = new ProviderDataSource(new ProviderDatabase( data ), this.sort, this.paginator);

      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
     .debounceTime(150)
     .distinctUntilChanged()
     .subscribe(() => {
       if (!this.aProvider) { return; }
       this.aProvider.filter = this.filter.nativeElement.value;
      });

      //Sort the data automatically

      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
    .catch(this.handleError);
  }


  deleteProvider(provider_id): void {
    this.onclose();
    this.provider_service.delete_Provider(provider_id).then(response => {
      this.app_service.success_message = 'Provider has been deleted successfully.';
      this.clearMsg();
      this.getProviderlist();
     })
     .catch(err => {
       try {
         const body = typeof err._body === 'string' ? JSON.parse(err._body) : err._body;
         this.app_service.errors = body?.error?.message || 'Error occurred while deleting Provider';
       } catch { this.app_service.errors = 'Error occurred while deleting Provider'; }
       this.clearMsg();
   });
   }

  // Modal related
  showStaticModal(deleteTemplate,provider_name,provider_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { provider_name : provider_name,provider_id: provider_id } });
    }); 
  }

  onclose() {
    this.windowRef.close();
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
      return  `with: ${reason}`;
    }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
