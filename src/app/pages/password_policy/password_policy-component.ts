import { Component, OnInit } from '@angular/core';
import { User } from '../user/user';
import {  PasswordPolicy } from './password_policy';
import { AUserService } from '../user/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordPolicy_Service } from './password_policy.service';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-password_policy-component',
  templateUrl: './password_policy-component.html',
  styleUrls: ['./password_policy-component.scss']
})
export class Password_PolicyComponent implements OnInit{
  
  constructor( public user_service: AUserService, private router: Router,
     public pass_policy: PasswordPolicy_Service, private app_service: AppService){
    
  }
  ngOnInit(){
    this.get_policy();
  }

  user: User= new User;
  passPolicy: PasswordPolicy = new PasswordPolicy;
  user_permission: any = [];
  isError = false;
  errorText: any = [];
  sessiontime: number;


  addPolicy(): void {
    if (this.errorText.length === 0) {      
        this.pass_policy.add_Policy(this.passPolicy).then(response => {   
          this.app_service.success_message = 'Password Policy Updated Successfully';
          setTimeout(() => {
            this.app_service.success_message = '';
          }, 5000);
        });
    }else{
      this.errorHandler(true, this.errorText);
    }
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

      get_policy(){
        this.pass_policy.get_Policy().then(response => {
          this.passPolicy = response;
        })
      }
}
  


