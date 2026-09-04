import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { IncomingNumber } from './incoming_number';
import { IncomingNumberService } from './incoming_number.service';
import { DIDService } from '../did/did.service';
import { ExtensionService } from '../extension/extension.service';
import 'rxjs/add/operator/toPromise';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-edit-incoming-component',
  templateUrl: './edit-incoming_number-component.html',
  styleUrls: ['./edit-incoming_number-component.scss'],
})

export class EditIncomingNumberComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private in_number_service: IncomingNumberService,
  private router: Router, private did_service: DIDService, private ext_service: ExtensionService, private app_service : AppService) { }


  form1: any= {};
  incomingNumber: IncomingNumber= new IncomingNumber;
  id: any= null;
  exts: any = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.in_number_service.get_Data(this.id).then(data => {
          this.incomingNumber = data;
        });
      }
    });
  }

  update_did() {
    this.in_number_service.update_account(this.incomingNumber).then(response => {
      this.router.navigate(['../../incoming_number'], {relativeTo: this.route});
      this.app_service.success_message = 'DID has Updated Successfully';
      this.clearMsg();
    })
    .catch(err => {
      this.app_service.errors = 'Error while Updating DID';
      this.clearMsg();
  });
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
