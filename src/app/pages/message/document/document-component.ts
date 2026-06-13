import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DocumentService } from './document.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { DocumentDatabase } from './document-database.component';
import { DocumentDataSource } from './document-datasource.component';
import { ModalComponent } from '../../../modal.component';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { concat, fromEvent } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import 'rxjs/add/operator/debounceTime';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ContactService } from '../../contact/contact.service';
import { Contact } from '../../contact/contact';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';
import { SendFax } from '../../sendfax/sendfax';
import { Document } from './document';
import { SendFaxService } from '../../sendfax/sendfax.service';
import { DocumentProgram } from '../../campaigns/campaign';
import { NbWindowRef, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { NbDialogService } from '@nebular/theme';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CoverpageService } from '../../coverpage/coverpage-service.service';
import { coverpage } from '../../coverpage/coverpage';
import { AppService } from '../../../app.service';

@Component({
  selector: 'ngx-document-component',
  templateUrl: './document-component.html',
  styleUrls: ['./document-component.scss'],
})

export class FormsDocumentComponent implements OnInit {
  constructor(
    private document_service: DocumentService,
    private modalService: NgbModal,
    private contact_service: ContactService,
    private completerService: CompleterService,
    private sendfax_service: SendFaxService,
    private windowService: NbWindowService,
    private translateService: TranslateService,
    private dialogService: NbDialogService,
    private NgbModule: NgbModule,
    private app_service: AppService,
    private coverpage_service: CoverpageService
  ) { }

  aDocument: DocumentDataSource | null;
  length: number = 0;
  closeResult: any;
  docArray: any = [];
  contactArray: Contact[] = [];
  documentArray: Document[] = [];
  dataService: CompleterData;
  trans_id: any;
  lastpage: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;

  documentProgram: DocumentProgram = new DocumentProgram;
  private modalRef: NgbModalRef;
  private windowRef: NbWindowRef;
  private WindowService: NbWindowService
  displayedColumns = ['ID', 'name', 'Operations'];
  documentURL: string;
  // documentURL: string = "http://demo.ictfax.com/data/document/document_0_74.tif.pdf";
  // faxDocumentURL: string = "https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf";
  faxDocumentURL: string;
  totalPages: number = 0;
  page: number = 1;
  isLoaded: boolean = false;
  isError = false;
  errorText: any = [];
  key: any = '';
  value: any = '';
  search: any = '';
  zoom = 1;
  sendheader: boolean = false;
  retry: boolean = false;
  sendcover: boolean = false;
  disablesendcover: boolean = false;
  user: any = {};
  coverArray: coverpage[] = [];



  @ViewChild(MatSort, { static: false }) sort: MatSort;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  @ViewChild('filter', { static: false }) filter: ElementRef = null;
  sendfax: SendFax = new SendFax;

  ngOnInit() {
    this.getDocumentlist(this.pageSize, this.pageIndex);
    this.gettotalrows();
    this.getContactList();
    this.getCoverpagelist();
  }

  openSearchModal(searchTemplate_Doc) {
    const modalRef = this.modalService.open(searchTemplate_Doc);
    modalRef.result.then(
      (result) => { },
      (reason) => { }
    );
  }

  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getDocumentlist(event.pageSize, 0, 1)
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
          this.getDocumentlist(event.pageSize, pageindex);
        }
      }
    });
  }

  getCoverpagelist() {
    const tenantId = localStorage.getItem('tid');

    this.coverpage_service.get_CoverpageList(tenantId)
      .then(data => {
        this.coverArray = data || [];

        if (this.coverArray.length > 0) {
          this.documentProgram.cover_id =
            this.coverArray[this.coverArray.length - 1].coverpage_id;
        }
      })
      .catch(err => console.error(err));
  }


  gettotalrows() {
    this.document_service.gettotalrows().then(data => {
      this.paginator.length = data;
    })
  }

  zoomIn() {
    this.zoom = Math.min(3, this.zoom + 0.5);
    console.log(this.zoom)
  }

  zoomOut() {
    this.zoom = Math.max(0.5, this.zoom - 0.5);
    console.log(this.zoom)
  }

  getDocumentlist(pageSize = null, pageIndex = null, reget = 0, filter = null) {
    this.filter = filter;
    this.document_service.get_DocumentList(filter, pageSize, pageIndex).then(data => {
      this.length += data.length;
      this.docArray = this.docArray.concat(data);
      if (filter) {
        this.length = data.length;
        this.paginator.length = data.length;
        this.pageIndex = 0;
        this.docArray = data;
      }
      if (reget) {
        this.length = data.length;
        this.docArray = data;
        this.paginator.pageIndex = 0;
      }
      this.aDocument = new DocumentDataSource(new DocumentDatabase(this.docArray), this.sort, this.paginator);
      if (filter == null && reget == 0) {
        this.paginator.pageIndex = this.lastpage;
      }
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
          if (!this.aDocument) { return; }
          this.aDocument.filter = this.filter.nativeElement.value;
        });
    });
  }

  deleteDocument(document_id): void {
    this.document_service.delete_Document(document_id)
      .then(response => {
        this.app_service.success_message = 'Document has been deleted successfully.';
        this.clearMsg();
        this.closeModal();
        this.docArray = this.docArray.filter(doc => doc.document_id !== document_id);

        this.aDocument = new DocumentDataSource(new DocumentDatabase(this.docArray), this.sort, this.paginator);
        this.paginator.pageIndex = this.pageIndex;
        const sortState: Sort = { active: 'ID', direction: 'desc' };
        this.sort.active = sortState.active;
        this.sort.direction = sortState.direction;
        this.sort.sortChange.emit(sortState);
      })
      .catch(err => {
        this.app_service.errors = 'Error occurred while deleting Document';
        this.clearMsg();
        this.closeModal();
      });
  }


  resetsearch(modal) {
    this.getDocumentlist(1, 10, 0);
    this.gettotalrows();
    modal.close();
  }
  searchDoc(modal) {
    var filter = '';
    filter += `${this.key}=${this.value}`;
    this.getDocumentlist(null, null, 0, filter);
    modal.close();
  }

  showStaticModal(deleteTemplate, name, document_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { name: name, document_id: document_id } });
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

  // Send Fax related Form
  open(content, contact_id) {
    this.documentProgram.document_id = contact_id;
    this.translateService.get('contact.contact_form.title').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(content, { title: translatedTitle });
    });
  }

  onclose() {
    this.windowRef.close({ cleared: true });
  }

  // Show Fax PDF
  showPDF(pdfViewerTemplate, document_id) {
    this.translateService.get('fax_viewer.title').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(
        pdfViewerTemplate,
        {
          title: translatedTitle,
        },
      );
      this.viewFaxDocument(document_id);
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
    this.windowRef.close();
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }
  getContactList() {
    this.contact_service.get_ContactList().then(data => {
      this.contactArray = data;
      this.dataService = this.completerService.local(this.contactArray, 'phone', 'phone');
    })
  }

  onSelected(item: CompleterItem) {
    if (item != null) {
      this.sendfax.contact_id = item.originalObject.contact_id;
    }
    else {
      this.sendfax.contact_id = undefined;
    }
  }

  addSendDocument(): void {

    this.sendfax.try_allowed = this.retry ? this.sendfax.try_allowed : 0;
    this.sendfax.personalize_fax = this.sendfax.personalize_fax ? 1 : 0;
    this.user.cover = this.sendheader ? 1 : 0;


    if (!this.sendcover) {
      this.documentProgram.cover_id = 0;
    }

    if (this.sendfax.contact_id != undefined) {
      this.sendfax.phone = undefined;
    }

    this.sendfax_service.add_senddocument(this.documentProgram).then(response => {
      const program_id = response;
      this.sendfax.program_id = program_id;
      this.AddTransmission();
      this.closeModal();
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

  downloadDocument(document_id): void {
    this.document_service.get_Documentdownload(document_id);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
  private errorHandler(status, message): any {
    this.isError = status;
    this.errorText = message;
    if (status) {
      setTimeout(() => {
        this.isError = false;
        this.errorText = [];
      }, 10000);
    }
  }
}