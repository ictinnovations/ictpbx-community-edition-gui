import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, Response, HttpModule, RequestOptions, ResponseContentType } from '@angular/http';
import { Document } from './document';
import { AppService } from '../../../../app/app.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import * as FileSaver from 'file-saver';
import { getFileNameFromResponseContentDisposition, saveFile } from '../../../file-download-helper';

@Injectable()

export class DocumentService {

  aDocument: Document[] = [];
  document_id: any = null;

  transmission_id: any = null;
  document: Document = new Document();

  constructor(private http: Http, private app_service: AppService) { }

  URL = `${this.app_service.apiUrlDocument}/${this.document_id}/media`;

  get_DocumentList(filter = null, pageSize = null, pageIndex = null): Promise<Document[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    var url5 = `${this.app_service.apiUrlDocument}`;
    if (filter != null) {
      url5 = `${this.app_service.apiUrlDocument}?${filter}`;
    }
    if (pageSize) {
      url5 += `?pageSize=${pageSize}&pageIndex=${pageIndex}`;
    }
    return this.http
      .get(url5, options)
      .toPromise()
      .then((response) => response.json() as Document[])
      .catch((response) => this.app_service.handleError(response));
  }

  gettotalrows() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url = `${this.app_service.apiUrlDocument}?totalrows`;
    return this.http
      .get(url, options)
      .toPromise()
      .then((response) => response.json())
      .catch((response) => this.app_service.handleError(response));
  }

  get_DocumentData(document_id): Promise<Document> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const url5 = `${this.app_service.apiUrlDocument}/${document_id}`;
    return this.http.get(url5, options).toPromise()
      .then(response => response.json() as Document).catch(response => this.app_service.handleError(response));
  }


  // async get_Documentdownload(document_id): Promise<any> {
  //   try {
  //     const headers = new Headers();
  //     this.app_service.createAuthorizationHeader(headers);
  //     const options = new RequestOptions({ headers: headers });
  //     options.responseType = ResponseContentType.Blob;
  //     const url = `${this.app_service.apiUrlDocument}/${document_id}/media`;
  //     const res = await this.http.get(url, options).toPromise();
  //     const fileName = getFileNameFromResponseContentDisposition(res);
  //     await saveFile(res.blob(), fileName);
  //     this.flush_PDF_Document(document_id);
  //   } catch (err) {
  //     this.app_service.downloadError(err);
  //   }
  // }

  async get_Documentdownload(document_id, transmission_id = null): Promise<any> {

    try {
      const headers = new Headers();
      this.app_service.createAuthorizationHeader(headers);
      const options = new RequestOptions({ headers: headers });
      options.responseType = ResponseContentType.Blob;
      var user_id = localStorage.getItem('aid');
      var url_doc = `${this.app_service.apiUrlDocument}/${document_id}/${user_id}/media`;
      if (transmission_id) {
        var url_doc = `${this.app_service.apiUrlDocument}/${document_id}/media/${transmission_id}`;
      }
      // Use fetch API to download the file
      const response = await this.http.get(url_doc, options).toPromise();
      if (!response.ok) throw new Error('Failed to download file');
      // Get the filename from the Content-Disposition header
      const fileName = getFileNameFromResponseContentDisposition(response);
      await saveFile(response.blob(), fileName);
      // this.flush_PDF_Document(document_id);
    }
    catch (err) {
      this.app_service.downloadError(err);
    }
  }




  flush_PDF_Document(document_id): any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    options.responseType = ResponseContentType.Blob;
    var user_id = localStorage.getItem('aid');
    const url = `${this.app_service.apiUrlDocument}/${document_id}/${user_id}/media`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }

  get_ViewFaxDocument(document_id): any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    options.responseType = ResponseContentType.Blob;
    const user_id = localStorage.getItem('aid');
    const url = `${this.app_service.apiUrlDocument}/${document_id}/${user_id}/media`;
    return url;
    // this.http.get(url, options).subscribe(res => {
    //   return res.url;
    //   // console.log(res.url);
    //   // const fileName = getFileNameFromResponseContentDisposition(res);
    //   // saveFile(res.blob(), fileName);
    // }, error => {
    //   this.app_service.downloadError(error);
    // });
  }

  add_Document(document: Document): Promise<Document> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(document);
    const addDocumentUrl = `${this.app_service.apiUrlDocument}`;
    return this.http.post(addDocumentUrl, body, options).toPromise().then(response => response.json() as Document)
      .catch(response => this.app_service.handleError(response));
  }

  update_Document(document: Document): Promise<Document> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(document);
    const updateDocumentUrl = `${this.app_service.apiUrlDocument}/${document.document_id}`;
    return this.http.put(updateDocumentUrl, body, options).toPromise().then(response => response.json() as Document)
      .catch(response => this.app_service.handleError(response));
  }

  upload_Document(document: Document): Promise<Document> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const body = JSON.stringify(document);
    const uploadDocumentUrl = `${this.app_service.apiUrlDocument}/${document.document_id}/media`;
    return this.http.put(uploadDocumentUrl, body, options).toPromise().then(response => response.json() as Document)
      .catch(response => this.app_service.handleError(response));
  }

  delete_Document(document_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers });
    const deleteDocumentUrl = `${this.app_service.apiUrlDocument}/${document_id}`;
    return this.http.delete(deleteDocumentUrl, options).toPromise().then(response => response.json() as Document)
      .catch(response => this.app_service.handleError(response));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}