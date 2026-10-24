import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Campaign, DocumentProgram } from '../campaign';
import { CampaignService } from '../campaign.service';
import { Document } from '../../message/document/document';
import { DocumentService } from '../../message/document/document.service';
import { Group } from '../../contact/group/group';
import { GroupService } from '../../contact/group/group.service';
import 'rxjs/add/operator/toPromise';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from '../../../app.service';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { NbWindowRef, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { SendFax } from '../../sendfax/sendfax';
import { SendFaxService } from '../../sendfax/sendfax.service';
import { FormsCampaignComponent } from '../campaign-component';
import { DID } from '../../did/did';



@Component({
  selector: 'ngx-add-campaign-component',
  templateUrl: './campaign-document-component.html',
  styleUrls: ['./campaign-document-component.scss'],
})

export class AddDocCampaignComponent implements OnInit {

  constructor(
  private http: Http, 
  private route: ActivatedRoute, 
  private document_service: DocumentService,
  private group_service: GroupService, 
  private campaign_service: CampaignService, 
  private router: Router,
  private modalService: NgbModal, 
  public app_service: AppService,
  private windowService: NbWindowService,
  private translateService: TranslateService,
  private sendfax_service: SendFaxService, 


) { }

  form1: any= {};
  documentProgram: DocumentProgram = new DocumentProgram;
  campaign: Campaign= new Campaign;
  campaign_id: any= null;
  group: Group[] = [];
  selectedGroup: Group;
  documentArray: Document[] = [];
  document: Document = new Document;
  sendfax: SendFax = new SendFax;
  accountArray: DID[] = [];


  public file_sending = false;
  public file_sent = false;

  file: any = [];
  document_id:any = [];
  URL = `${this.app_service.apiUrlDocument}/${this.document_id}/media`;
  public uploader: FileUploader = new FileUploader({url: this.URL, disableMultipart: true });

  unsupportedErr: any = false;
  private windowRef: NbWindowRef;
  private modalRef: NgbModalRef;
  
  isError = false;
  errorText: any = [];

  ngOnInit(): void {
    this.app_service.checkFaxProvider();
    this.getAccountlist();

    this.route.params.subscribe(params => {
      this.campaign_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.campaign_service.get_CampaignData(this.campaign_id).then(data => {
          this.campaign = data;
        });
      }
    });

    this.getDocumentlist();
    this.getGrouplist();
    console.log('Account Array:', this.accountArray);

    this.document.quality = 'standard';

    this.uploader.onBeforeUploadItem = (item) => {
      item.method = 'POST';
      item.url = this.URL;
      item.withCredentials = false;
    };
    
    this.uploader.onAfterAddingFile = (response: any) => {
      console.log(response);
      this.file = response;
      if (response.file.type == 'application/pdf' || response.file.type == 'image/png' || response.file.type == 'image/jpg' || response.file.type == 'image/jpeg' || response.file.type == 'image/tiff' || response.file.type == 'image/tif' || response.file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || response.file.type == 'application/msword' || response.file.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || response.file.type == 'application/vnd.ms-powerpoint' || response.file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || response.file.type == 'application/vnd.ms-excel' || response.file.type == 'application/vnd.oasis.opendocument.text' || response.file.type == 'application/vnd.oasis.opendocument.presentation' ||  response.file.type == 'application/vnd.oasis.opendocument.spreadsheet') {
        
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
    const uploadOptions = <FileUploaderOptions>{headers : authHeader};
    this.uploader.setOptions(uploadOptions);
    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => {
    };

    this.uploader.onCompleteAll = () => {
      console.log('complete');
      this.file_sent = true;
      this.file_sending = false;
      this.modalRef.close();
      this.getDocumentlist();
    };
  }
 
  addSendDocument(): void {
    this.checkFields("new");
    if (this.errorText.length === 0) {
      this.campaign_service.add_senddocument(this.documentProgram).then(response => {
        const program_id = response;
        this.campaign.program_id = program_id;
        this.addCampaign();
      });
    }else{
      this.errorHandler(true, this.errorText);
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

  addCampaign(): void {
    this.campaign_service.add_Campaign(this.campaign).then(response => {
      this.router.navigate(['../../../campaigns'], {relativeTo: this.route});
      this.app_service.success_message = 'Campaign created succussfully';
      this.startCampaign(response);
      this.clearMsg();
    })
    .catch(err => {
      this.app_service.errors = 'Error occurred while creating Campaign';
      this.clearMsg();
  });
  }

  startCampaign(campaign_id): void {
    this.campaign_service.start_campaign(campaign_id).then(response => {
      
    });
  }

  updateCampaign(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.campaign_service.add_senddocument(this.documentProgram).then(response => {
        const program_id = response;
        this.campaign.program_id = program_id;
        this.update();
        this.router.navigate(['../../../campaigns'], {relativeTo: this.route});
        this.app_service.success_message = 'Campaign updated successfully';
        this.clearMsg();
      });
    }else{
      this.app_service.err_message = 'Error occurred while updating Campaign';
      this.clearMsg(); 
    }
  }

  update(): void {
    this.campaign_service.update_Campaign(this.campaign).then(() => {})
    .catch(this.handleError);
  }

  getDocumentlist() {
    this.document_service.get_DocumentList().then(data => {
      this.documentArray = data;
      if (data) this.documentProgram.document_id = this.documentArray[this.documentArray.length -1].document_id;
    });
  }
  getAccountlist() {
    this.sendfax_service.get_AccountList().then(data => {
      this.accountArray = data;
      this.sendfax.account_id = this.accountArray[this.accountArray.length -1].account_id;
    })
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

  getGrouplist() {
    this.group_service.get_GroupList().then(data => {
      this.group = data;
    });
  }

  get selectedGrp() {
    return this.selectedGroup;
  }

  set selectedGrp(value) {
    this.selectedGroup = value;
    this.campaign.group_id = this.selectedGroup.group_id;
  }

  file_upload() {
    this.document_service.add_Document(this.document).then(response => {
      const document_id = response;
      this.documentProgram.document_id = response;
      this.URL = `${this.app_service.apiUrlDocument}/${document_id}/media`;
      this.upload();
      this.onSave();
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

  upload () {
    this.file_sending = true;
    this.uploader.uploadAll();
  }

  open(contentTemplate) {
    this.translateService.get('document.upload_document').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(contentTemplate, { title: translatedTitle });
    }); 
  }

  onSave() {
    this.windowRef.close();
  }

  remove(item) {
    console.log(this.uploader.queue.length - 1);
  }

  private checkFields(status = null):any{
    this.errorHandler(false, [])
    if (!this.documentProgram.document_id) this.errorText.push("Select or Upload document.");
    if (status == "new" && !this.campaign.group_id) this.errorText.push("Choose Group.");
  }

  private errorHandler(status, message):any{
    this.isError = status;
    this.errorText = message;
    if (status) {
      setTimeout(() => {
        this.isError = false;
        this.errorText = [];
      }, 10000);
    }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
