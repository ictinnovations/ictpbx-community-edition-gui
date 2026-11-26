import { Component, OnInit, Input, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Headers, Response, RequestOptions } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { Document } from './document';
import { DocumentService } from './document.service';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import { AppService } from '../../../app.service';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { FileSelectDirective, FileDropDirective } from 'ng2-file-upload/ng2-file-upload';
import { NgClass, NgStyle } from '@angular/common';



@Component({
  selector: 'ngx-add-document-component',
  templateUrl: './document-form-component.html',
  styleUrls: ['./document-form-component.scss'],
})

export class AddDocumentComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private document_service: DocumentService, private app_service: AppService,
    private router: Router) { }


  form1: any = {};
  file: any[] = [];
  document: Document = new Document;
  document_id: any = null;
  URL = `${this.app_service.apiUrlDocument}/${this.document_id}/media`;
  public uploader: FileUploader = new FileUploader({ url: this.URL, disableMultipart: true });

  unsupportedErr: any = false;

  isError = false;
  errorText: any = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.document_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        this.document.quality = 'standard';
        return null;
      } else {
        return this.document_service.get_DocumentData(this.document_id).then(data => {
          this.document = data;
        });
      }
    });

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

  }

  addDocument(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.document_service.add_Document(this.document).then(response => {
        const document_id = response;
        this.URL = `${this.app_service.apiUrlDocument}/${document_id}/media`;
        this.upload();
        this.router.navigate(['../../document'], { relativeTo: this.route });
        this.app_service.success_message = 'Document created succussfully';
        this.clearMsg();
      });
    } else {
      this.app_service.err_message = 'Error occurred while creating Document';
      this.clearMsg();
    }
  }

  updateDocument(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.document_service.update_Document(this.document).then((response) => {
        this.URL = `${this.app_service.apiUrlDocument}/${this.document_id}/media`;
        if (this.file != null) {
          this.upload();
        }
        this.router.navigate(['../../document'], { relativeTo: this.route });
        this.app_service.success_message = 'Document updated successfully';
        this.clearMsg();
      })
        .catch(this.handleError);
    } else {
      this.app_service.err_message = 'Error occurred while updating Document';
      this.clearMsg();
    }
  }

  uploadDocument(): void {
    this.document_service.upload_Document(this.document)
      .then((response) => {
        this.router.navigate(['../../document'], { relativeTo: this.route });
      });
  }

  // upload() {
  //   if (this.uploader.queue.length > 0) {
  //     for(let i=0 ; i < this.uploader.queue.length ; i++){
  //       let fileItem = this.uploader.queue[i];
  //       fileItem.upload();
  //     }
  //   } else {
  //     console.log("No file selected for upload.");
  //   }
  // }


  upload() {
    if (this.uploader.queue.length > 0) {
      const fileItem = this.uploader.queue[0];
      fileItem.onSuccess = () => {
        this.uploader.removeFromQueue(fileItem);
        this.upload();
      };
      fileItem.onError = () => {
        this.uploader.removeFromQueue(fileItem);
        this.upload();
      };
      fileItem.upload();
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }
  private hasBaseDropZoneOver = false;
  private hasAnotherDropZoneOver = false;

  private fileOverBase(e: any) {
    this.hasBaseDropZoneOver = e;
  }

  private fileOverAnother(e: any) {
    this.hasAnotherDropZoneOver = e;
  }

  private checkFields(status = null): any {
    this.errorHandler(false, [])
    if (!this.document.name) this.errorText.push("Document name is required.");
    // if (this.file == null) this.errorText.push("Document file is required.");
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

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
