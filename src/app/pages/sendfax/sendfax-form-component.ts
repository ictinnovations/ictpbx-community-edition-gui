import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http } from '@angular/http';
import { SendFax, DocumentProgram } from './sendfax';
import { ExtensionService } from '../extension/extension.service';
import { CoverpageService } from '../coverpage/coverpage-service.service';
import { coverpage } from '../coverpage/coverpage';
import { Extension } from '../extension/extension';
import { FaxSettingsComponent } from '../faxsettings/faxsettings-component';
import { AUserService } from '../user/user.service';
import { User } from '../user/user';
import { SendFaxService } from './sendfax.service';
import { DocumentService } from '../message/document/document.service';
import { Document } from '../message/document/document';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/toPromise';
import { Contact } from '../contact/contact';
import { ContactService } from '../contact/contact.service';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DID } from '../did/did';
import { NbWindowRef, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { CID } from '../cid/cid';

@Component({
  selector: 'ngx-add-sendfax-component',
  templateUrl: './sendfax-form-component.html',
  styleUrls: ['./sendfax-form-component.scss'],
})

export class AddSendFaxComponent implements OnInit {

  constructor(
    private http: Http,
    private route: ActivatedRoute,
    private extension_service: ExtensionService,
    private user_service: AUserService,
    private coverpage_service: CoverpageService,
    private document_service: DocumentService,
    private sendfax_service: SendFaxService,
    private router: Router,
    public app_service: AppService,
    private contact_service: ContactService
    , private completerService: CompleterService,
    private modalService: NgbModal,
    private windowService: NbWindowService,
    private translateService: TranslateService,


  ) { }


  form1: any = {};
  documentProgram: DocumentProgram = new DocumentProgram;
  program_id: any = null;
  sendfax: SendFax = new SendFax;
  documentArray: Document[] = [];
  account_id: any = null;
  retry: any = false;
  extension: Extension = new Extension;
  user: User = new User;
  sendcover: any = false;
  sendbody: any = false;
  tenant_id = localStorage.getItem('tid');
  coverpage: coverpage = new coverpage;
  coverArray: coverpage[] = [];
  accountArray: CID[] = [];
  document: Document = new Document;
  selectedDocument: any;
  personalize_fax: any = null;
  trans_id: number;
  dataService: CompleterData;
  protected searchStr: string;
  file_uploaded: boolean = false;
  contactArray: Contact[] = [];

  public file_sending = false;
  public file_sent = false;

  selectedContact: Contact;

  filteredContacts = [...this.contactArray];
  isError = false;
  errorText: any = [];
  searchText: string = '';
  contact_options: any = [];
  file: any = [];
  document_id: any = [];
  file_attach: any = '';
  file_attach_color: any = 'blue';
  URL = `${this.app_service.apiUrlDocument}/${this.document_id}/media`;
  public uploader: FileUploader = new FileUploader({ url: this.URL, disableMultipart: true });

  unsupportedErr: any = false;
  private windowRef: NbWindowRef;
  private modalRef: NgbModalRef;

  ngOnInit(): void {
    this.app_service.checkFaxProvider();
    this.sendfax.try_allowed = 1;
    this.extension_service.get_ExtensionData(-1).then(data => {
      this.extension = data;
      this.extension_service.get_ExtensionData(-1).then(data => {
        this.extension = data;
      })
    }).catch(err => this.handleError(err));

    this.getCoverpagelist();

    // this.getDocumentlist();

    this.getContactlist();

    this.getAccountlist();

    this.getPermission();
    this.document.quality = 'standard';

    this.uploader.onBeforeUploadItem = (item) => {
      item.method = 'POST';
      item.url = this.URL;
      item.withCredentials = false;
    };

    this.uploader.onAfterAddingFile = (response: any) => {
      this.file = response;
      if (response.file.type == 'application/pdf' || response.file.type == 'image/png' || response.file.type == 'image/jpg' || response.file.type == 'image/jpeg' || response.file.type == 'image/tiff' || response.file.type == 'image/tif' || response.file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || response.file.type == 'application/msword' || response.file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || response.file.type == 'application/vnd.ms-excel' || response.file.type == 'application/vnd.oasis.opendocument.text' || response.file.type == 'application/vnd.oasis.opendocument.presentation' || response.file.type == 'application/vnd.oasis.opendocument.spreadsheet') {
        this.unsupportedErr = false;
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

    this.uploader.onCompleteAll = () => {
      this.file_sent = true;
      this.file_sending = false;
      this.modalRef.close();
      // this.getDocumentlist();
    };

  }


  // Filter while typing
  filteredOptions() {
    const filter = this.searchText.toLowerCase();
    return this.contact_options.filter(o => o.toLowerCase().includes(filter));
  }

  validateValue() {
    const lower = this.searchText.toLowerCase();

    this.filteredContacts = this.contactArray.filter(c =>
      String(c.phone).toLowerCase().includes(lower)
    );
    this.sendfax.phone = this.searchText;
    console.log(this.sendfax.phone)
  }
  onOptionSelected(option) {
    this.searchText = option.phone;
    this.sendfax.phone = option.phone;
    this.selectedContact = option;
    this.sendfax.contact_id = option.contact_id;
  }

  async sendnewFax() {
    // await this.addDocument()
    this.checkFields();
    if (this.errorText.length === 0) {
      this.addSendDocument();
    } else {
      this.errorHandler(true, this.errorText);
    }
  }
  
  updateSettings(account_id) {
    this.extension.settings.emailtofax_coversheet = 'body';
    this.extension_service.update_Settings(account_id, this.extension.settings.emailtofax_coversheet).then(data => {
      // this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    })
      .catch(this.handleError);
  }


  deleteSettings(account_id) {
    this.extension_service.delete_Settings(account_id).then(data => {
      // this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    })
      .catch(this.handleError);
  }

  update_coverpagesettings(user) {
    this.user_service.update_User(user).then(data => {
      // this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    }).catch(this.handleError);
  }

  delete_coverpagesettings(account_id) {
    this.extension_service.delete_coverpageSettings(account_id).then(data => {
      // this.app_service.success_message = 'Fax Settings Updated Successfully';
      this.clearMsg();
    })
      .catch(this.handleError);
  }

  getCoverpagelist() {
    this.coverpage_service.get_CoverpageList(this.tenant_id).then(data => {
      this.coverArray = data;
      this.documentProgram.cover_id = this.coverArray[this.coverArray.length - 1].coverpage_id;
    })
  }

  onSelectcover(value) {
    if (value != 0) {
      this.coverpage.coverpage_id = value;
    }
    else {
      this.coverpage.coverpage_id = undefined;
    }
  }
  async addSendDocument() {

    if (this.sendfax.contact_id != undefined) {
      if (this.selectedContact.phone == this.sendfax.phone) {
        this.sendfax.phone = undefined;
      }
      else {
        this.sendfax.contact_id = undefined;
      }
    }

    this.document.name = this.sendfax.title?.trim() ? this.sendfax.title : 'Sendfax Document';
    this.document_service.add_Document(this.document).then(response => {
      this.file_attach = 'Uploading...';
      const document_id = response;
      this.documentProgram.document_id = response;
      this.URL = `${this.app_service.apiUrlDocument}/${document_id}/media`;
      this.upload();
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
      this.file_sending = false;
      this.router.navigate(['../../sendfax'], { relativeTo: this.route }).then(() => {
        this.app_service.success_message = 'Transmission Created successfully';
        this.clearMsg();
      });
    }).catch(error => {
      this.file_sending = false;
      this.app_service.errors = 'Error while creating transmission';
      this.clearMsg();
    });
  }
  // getDocumentlist() {
  //   this.document_service.get_DocumentList().then(data => {
  //     // this.documentArray = data;
  //     this.documentArray = data.sort((a, b) => a.document_id - b.document_id);
  //     this.documentProgram.document_id = this.documentArray[this.documentArray.length - 1].document_id;
  //     /*
  //     let newEntry:Document = new Document;
  //     newEntry.document_id = 0;
  //     newEntry.name = '--Upload new Document--';
  //     this.documentArray = data;
  //     this.documentArray.unshift(newEntry);
  //     */
  //   });
  // }

  getAccountlist() {
    this.sendfax_service.get_AccountList().then(data => {
      this.accountArray = data;
      this.sendfax.account_id = this.accountArray[this.accountArray.length - 1].account_id;
    })
  }

  onSelect(value) {
    if (value != 0) {
      this.documentProgram.document_id = value;
    }
    else {
      this.documentProgram.document_id = undefined;
    }
  }

  onSelectAccount(value) {
    if (value != 0) {
      this.sendfax.account_id = value;
    }
    else {
      this.sendfax.account_id = undefined;
    }
  }

  async addDocument() {
    this.document.name = this.sendfax.title?.trim() ? this.sendfax.title : 'Sendfax Document';
    this.document_service.add_Document(this.document).then(response => {
      this.file_attach = 'Uploading...';
      const document_id = response;
      this.documentProgram.document_id = response;
      this.URL = `${this.app_service.apiUrlDocument}/${document_id}/media`;
      this.upload();
    });
  }

  upload() {
    this.file_uploaded = false;
    this.file_sending = true;
    this.uploader.uploadAll();
    const fileItem = this.uploader.queue[0];
    const fileName = fileItem.file.name;
    this.uploader.onCompleteAll = () => {
      this.file_uploaded = true;
      this.file_sent = true;
      this.file_sending = false;
      this.file_attach = 'File uploaded successfully.';
      this.file_attach_color = 'green';
      // this.getDocumentlist();
      this.sendfax_service.add_senddocument(this.documentProgram).then(response => {
        const program_id = response;
        this.sendfax.program_id = program_id;
        this.AddTransmission();
        this.router.navigate(['../../sendfax'], { relativeTo: this.route });
      });
    };
  }

  private hasBaseDropZoneOver = false;
  private hasAnotherDropZoneOver = false;

  private fileOverBase(e: any) {
    this.hasBaseDropZoneOver = e;
  }

  private fileOverAnother(e: any) {
    this.hasAnotherDropZoneOver = e;
  }

  //Get contacts

  getContactlist() {
    this.contact_service.get_ContactList().then(data => {
      this.contactArray = data;
      if (!Array.isArray(this.contactArray)) {
        console.warn('contactArray is not an array', this.contactArray);
        return;
      }
      this.filteredContacts = this.contactArray;

      this.dataService = this.completerService.local(this.contactArray, 'phone', 'phone');
    });
  }

  onSelected(item: CompleterItem) {
    if (item != null) {
      this.sendfax.contact_id = item.originalObject.contact_id;
      this.selectedContact = item.originalObject;
    }
    else {
      this.sendfax.contact_id = undefined;
      this.selectedContact = undefined;
    }
  }

  // Fax Uploading related

  file_upload() {
    this.document_service.add_Document(this.document).then(response => {
      const document_id = response;
      this.documentProgram.document_id = response;
      this.URL = `${this.app_service.apiUrlDocument}/${document_id}/media`;
      this.upload();
      this.app_service.success_message = 'Document Uploaded Successfully';
      this.clearMsg();
    })
      .catch(err => {
        this.app_service.errors = 'Error while uploading Document';
        this.clearMsg();
      })
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }
  // Removing related

  remove(item) {
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

  open(contentTemplate, contact_id) {
    this.documentProgram.document_id = contact_id;
    this.translateService.get('document.upload_document').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(contentTemplate, { title: translatedTitle });
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


  get selectedCon() {
    return this.selectedContact;
  }

  set selectedCon(value) {
    this.selectedContact = value;
    this.sendfax.phone = this.selectedContact.phone;
    this.sendfax.contact_id = this.selectedContact.contact_id;
  }

  getPermission() {
    var perm = localStorage.getItem('permission');
    if (perm.includes('personalize_fax')) this.personalize_fax = 1;
  }

  private checkFields(status = null): any {
    this.errorHandler(false, [])
    // if (!this.document.document_id) this.errorText.push("Document is requiured.");
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
