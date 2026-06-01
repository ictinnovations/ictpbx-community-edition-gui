import { Component, OnInit, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { ContactService } from './contact.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ContactDatabase } from './contact-database.component';
import { ContactDataSource } from './contact-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs/Rx';
import { SendFaxService } from '../sendfax/sendfax.service';
import { CompleterData, CompleterItem, CompleterService } from 'ng2-completer';
import { Contact } from './contact';
import { DID } from '../did/did';
import { PageEvent } from '@angular/material/paginator';
import { DocumentProgram, SendFax } from '../sendfax/sendfax';
import { AppService } from '../../app.service';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { ActivatedRoute, Router } from '@angular/router';
import { Document } from '../message/document/document';
import { DocumentService } from '../message/document/document.service';
import { NbWindowRef, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';





@Component({
  selector: 'ngx-contact-component',
  templateUrl: './contact-component.html',
  styleUrls: ['./contact-component.scss'],
})


export class FormsContactComponent implements OnInit {
  constructor(private contact_service: ContactService,
    private modalService: NgbModal,
    private sendfax_service: SendFaxService,
    private completerService: CompleterService,
    private app_service: AppService, private router: Router,
    private route: ActivatedRoute, private document_service: DocumentService,
    private windowService: NbWindowService,
    private translateService: TranslateService,
  ) { }

  aContact: ContactDataSource | null;
  length: number = 0;
  closeResult: any;
  contactArray: Contact[] = [];
  accountArray: DID[] = [];
  trans_id: any;
  lastpage: number = 0;
  pageIndex: any = 0;
  pageSize: any = 10;
  sendfax: SendFax = new SendFax;
  documentProgram: DocumentProgram = new DocumentProgram;
  dataService: CompleterData;
  documentArray: Document[] = [];
  document: Document = new Document;

  public file_sending = false;
  public file_sent = false;
  private windowRef: NbWindowRef;
  private modalRef: NgbModalRef;

  file: any = [];
  document_id: any = [];
  URL = `${this.app_service.apiUrlDocument}/${this.document_id}/media`;
  public uploader: FileUploader = new FileUploader({ url: this.URL, disableMultipart: true });

  unsupportedErr: any = false;


  isError = false;
  errorText: any = [];

  displayedColumns = ['ID', 'firstName', 'lastName', 'Phone', 'Email', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    this.getContactlist(this.pageSize, this.pageIndex);
    this.getAccountlist();
    this.getDocumentlist();
    this.gettotalrows();

    this.document.quality = 'standard';
    this.uploader.onBeforeUploadItem = (item) => {
      item.method = 'POST';
      item.url = this.URL;
      item.withCredentials = false;
    };
    this.uploader.onAfterAddingFile = (response: any) => {
      console.log(response);
      this.file = response;
      if (response.file.type == 'application/pdf' || response.file.type == 'image/png' || response.file.type == 'image/jpg' || response.file.type == 'image/jpeg' || response.file.type == 'image/tiff' || response.file.type == 'image/tif' || response.file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || response.file.type == 'application/msword' || response.file.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || response.file.type == 'application/vnd.ms-powerpoint' || response.file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || response.file.type == 'application/vnd.ms-excel' || response.file.type == 'application/vnd.oasis.opendocument.text' || response.file.type == 'application/vnd.oasis.opendocument.presentation' || response.file.type == 'application/vnd.oasis.opendocument.spreadsheet') {
      }
      else {
        this.unsupportedErr = true;
        this.uploader.removeFromQueue(response);
        setTimeout(() => {
          this.unsupportedErr = false;
        }, 2000);
      }
    };

    const authHeader = this.app_service.upload_Header;
    const uploadOptions = <FileUploaderOptions>{ headers: authHeader };
    this.uploader.setOptions(uploadOptions);

    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => {
    };
  }
  ngAfterViewInit() {
    this.paginator.page.subscribe((event: PageEvent) => {
      if (event.pageSize != this.pageSize) {
        this.getContactlist(event.pageSize, 0, this.filter, 0)
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
          this.getContactlist(event.pageSize, pageindex);
        }
      }
    });
  }

  gettotalrows() {
    this.contact_service.gettotalrows().then(data => {
      this.paginator.length = data;
    })
  }

  onclose() {
    this.windowRef.close({ cleared: true });
  }

  getContactlist(pageSize = null, pageIndex = null, filter = null, reget = 0) {
    this.filter = filter;
    this.contact_service.get_ContactList(pageSize, pageIndex, filter).then(data => {
      if (filter) {
        this.length = data.length;
        this.paginator.length = data.length;
        this.paginator.pageIndex = 0;
        this.contactArray = data;
      } else {
        this.contactArray = this.contactArray.concat(data);
        this.length += data.length;
      }
      if (reget == 1) {
        this.contactArray = data;
        this.length = data.length;
      }

      this.aContact = new ContactDataSource(new ContactDatabase(this.contactArray), this.sort, this.paginator);
      if (filter == null && reget == 0) {
        this.paginator.pageIndex = this.lastpage;
      }
      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if (!this.aContact) { return; }
          this.aContact.filter = this.filter.nativeElement.value;
        });

      //Sort the data automatically

      const sortState: Sort = { active: 'ID', direction: 'desc' };
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }


  deleteContact(contact_id: number): void {
    if (this.windowRef) { this.windowRef.close(); }
    this.contact_service.delete_Contact(contact_id)
      .then(response => {
        this.contactArray = this.contactArray.filter(contact => contact.contact_id !== contact_id);
        this.aContact = new ContactDataSource(new ContactDatabase(this.contactArray), this.sort, this.paginator);
        this.app_service.success_message = 'Contact has been deleted successfully.';
        this.clearMsg();
        this.onSave();
      })
      .catch(err => {
        this.app_service.errors = 'Error occurred while deleting Contact';
        this.clearMsg();
      });
  }



  showStaticModal(deleteTemplate, first_name, contact_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { first_name: first_name, contact_id: contact_id } });
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

  //When we click on sendfax button in operation column....!

  getAccountlist() {
    this.sendfax_service.get_AccountList().then(data => {
      this.accountArray = data;
      this.sendfax.account_id = this.accountArray[this.accountArray.length - 1].account_id;

    })
  }
  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }
  //  When we click on sendfax button in operation column....!

  onSelectAccount(value) {
    if (value != 0) {
      this.sendfax.account_id = value;
    }
    else {
      this.sendfax.account_id = undefined;
    }
  }

  open(content, contact_id) {
    this.sendfax.contact_id = contact_id;
    this.translateService.get('contact.contact_form.title').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(content, { title: translatedTitle });
    });
  }

  onSave() {
    this.windowRef.close();
  }

  getdestination() {
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

  // sending fax to outbound

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

  getDocumentlist() {
    this.document_service.get_DocumentList().then(data => {
      this.documentArray = data;
      if (data) this.documentProgram.document_id = this.documentArray[this.documentArray.length - 1].document_id;
    });
  }

  onSelect(value) {
    if (value != 0) {
      this.documentProgram.document_id = value;
    }
    else {
      this.documentProgram.document_id = undefined;
    }
    console.log(this.documentProgram.document_id);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
