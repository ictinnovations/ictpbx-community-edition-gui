import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { coverpage } from './coverpage';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CoverpageDataSource } from './coverpage-datasource';
import { CoverpageDatabase } from './coverpage-database';
import { CompleterData, CompleterItem, CompleterService } from 'ng2-completer';
import { Observable } from 'rxjs/Rx';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CoverpageService } from './coverpage-service.service';
import { NbWindowService, NbWindowRef } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-coverpage-component',
  templateUrl: './coverpage-component.html',
  styleUrls: ['./coverpage-component.scss'],
})
export class FormCoverpageComponent implements OnInit {
  modalRef: any;
  constructor(private coverpage_service: CoverpageService,
    private modalService: NgbModal,
    private completerService: CompleterService,
    private translateService: TranslateService,
    private windowService: NbWindowService,
    private app_service: AppService

  ) { }

  private windowRef: NbWindowRef;


  aCover: CoverpageDataSource | null;
  length: number;
  closeResult: any;
  coverArray: coverpage[] = [];
  dataService: CompleterData;
  tenant_id = localStorage.getItem('tid');
  displayedColumns: string[] = ['coverpage_id', 'title', 'operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;
  ngOnInit(): void {
    this.getcoverpagelist();
  }

  showStaticModal(deleteTemplate, cover_title, coverpage_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { cover_title: cover_title, coverpage_id: coverpage_id } });
    });
  }

  getcoverpagelist() {
    this.coverpage_service.get_CoverpageList(this.tenant_id).then(data => {
      this.length = data.length;
      this.coverArray = data;
      this.aCover = new CoverpageDataSource(new CoverpageDatabase(data), this.sort, this.paginator);
      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if (!this.aCover) { return; }

          this.aCover.filter = this.filter.nativeElement.value;
        });

      //Sort the data automatically
      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }
  getdestination() {
    this.coverpage_service.get_CoverpageList(this.tenant_id).then(data => {
      this.coverArray = data;
      this.dataService = this.completerService.local(this.coverArray, 'title', 'title');
    })
  }

  deleteCoverpage(id): void {
    this.coverpage_service.delete_Coverpage(id)
      .then(() => {
        this.coverArray = this.coverArray.filter(item => item.coverpage_id !== id);
        this.aCover = new CoverpageDataSource(
          new CoverpageDatabase(this.coverArray),
          this.sort,
          this.paginator
        );
        this.length = this.coverArray.length;
        this.app_service.success_message = 'Cover Page has been deleted Successfully';
        this.clearMsg();
        this.onclose();
      })
      .catch(() => {
        this.app_service.errors = 'Error while deleting Cover Page';
        this.clearMsg();
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

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

}


