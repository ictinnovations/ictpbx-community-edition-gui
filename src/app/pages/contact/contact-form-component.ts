import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { Contact } from './contact';
import { ContactService } from './contact.service';
import 'rxjs/add/operator/toPromise';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-add-contact-component',
  templateUrl: './contact-form-component.html',
  styleUrls: ['./contact-form-component.scss'],
})

export class AddContactComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private contact_service: ContactService,
  private router: Router, private app_service : AppService) { }

  form1: any= {};
  contact: Contact= new Contact;
  contact_id: any= null;

  isError = false;
  errorText: any = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.contact_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.contact_service.get_ContactData(this.contact_id).then(data => {
          this.contact = data;
        });
      }
    });
  }

  addContact(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.contact_service.add_Contact(this.contact).then(response => {
        this.router.navigate(['../../contacts'], {relativeTo: this.route});
        this.app_service.success_message = 'Contact created succussfully';
       this.clearMsg();
      });
    }else{
      this.app_service.err_message = 'Error occurred while creating contact';
      this.clearMsg();  
    }
  }

  updateContact(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.contact_service.update_Contact(this.contact).then(() => {
        this.router.navigate(['../../contacts'], {relativeTo: this.route});
        this.app_service.success_message = 'Contact updated successfully';
        this.clearMsg();
      });
    }else{
      this.app_service.err_message = 'Error occurred while updating Contact';
      this.clearMsg();  
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }
  private checkFields(status = null):any{
    this.errorHandler(false, [])
    if (!this.contact.phone) this.errorText.push("Phone is required.");
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
