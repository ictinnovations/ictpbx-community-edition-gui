import { Component, OnInit, AfterViewInit, DoCheck } from '@angular/core';
import { AppService } from '../../app.service';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { User } from '../user/user';
import { FormsModule, FormGroup, FormBuilder, FormControl, NG_VALIDATORS, Validator, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { AUserService } from '../user/user.service';
import { PasswordPolicy } from '../password_policy/password_policy';
import { PasswordPolicy_Service } from '../password_policy/password_policy.service';

@Component({
  selector: 'ngx-handler',
  template: `<div class="row">
               <div class="col-md-12">
                 <nb-card>
                   <nb-card-body>
                     <div class="flex-centered col-xl-4 col-lg-6 col-md-8 col-sm-12">
                       <h2 class="title">{{ 'general.change_pass' | translate}}</h2>
                       <br>
                       <!--
                       <small class="sub-title">The server encountered an internal error or misconfiguration and was unable to complete your request.</small>
                       !-->
                       <form id="form" #f1="ngForm">
                       <div class="form-group">
                       <label for="previousPassword">{{'User.old_password' | translate}}: </label>
               <input type="password" class="form-control" id="previousPassword"
               required
               [(ngModel)]="previousPassword" name="previousPasswordtext" #previousPasswordtext="ngModel">
               <div [hidden]="previousPasswordtext.valid || previousPasswordtext.pristine" class="alert alert-danger">
                 {{'User.old_pass_required'| translate}}
               </div>
             </div>
                       <div class="form-group">
                       <label for="password">{{ 'User.password' | translate }}</label>
              <input type="password" class="form-control" id="password" required [(ngModel)]="user.password" (ngModelChange)="validatePassword($event)" name="password" #password="ngModel">
              <br>
              <div class="alert alert-danger" *ngIf="password.dirty && !isPasswordValid()">
              <div style="color: black;"><b>Password Requirements</b>
              </div>
              <br>
                <ul>
                  <li *ngIf="!requirements.minLength">Minimum length is {{ policy.min_length }} characters</li>
                  <li *ngIf="!requirements.specialCharacter">At least {{ policy.special_character }} special character</li>
                  <li *ngIf="!requirements.number">At least {{ policy.min_numbers }} number</li>
                  <li *ngIf="!requirements.uppercase">At least {{ policy.min_uppercase }} uppercase letter</li>
                  <li *ngIf="!requirements.lowercase">At least {{ policy.min_lowercase }} lowercase letter</li>
                </ul>
              </div>
            </div>
               
           <div class="form-group">
             <label for="confirmPassword">{{ 'User.confirm_password' | translate }}</label>
             <input type="password" class="form-control" id="confirmPassword" required [(ngModel)]="user.confirmPassword" name="confirmPassword" #confirmPassword="ngModel"><br>
             <div *ngIf="confirmPassword.dirty && user.password !== user.confirmPassword" class="alert alert-danger">
               {{ 'User.password_mismatch' | translate }}
             </div>
             </div>
                       </form>  
                       <button nbButton [disabled]="!canSubmit()" fullWidth status="success" (click)="goToHome()" >{{ 'buttons.submit' | translate}}</button>
  	                 </div>
  	               </nb-card-body>
  	            </nb-card>
  	          </div>
  	       </div>`,
  styleUrls: ['./changepassword-component.scss'],
})
export class ChangePasswordComponent {

  constructor(private router: Router, private authService: NbAuthService, private user_service: AUserService, private app_service: AppService,
    private password_policy: PasswordPolicy_Service) {

    this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken) => {
        if (token && token.getValue()) {
          this.auser = token.getPayload();
          // console.log(this.auser);
          this.user.user_id = this.auser.user_id;
        }
      })
  }

  user: User = new User;
  preUser: User = new User;
  form: FormGroup;
  auser: any;
  policy: PasswordPolicy = new PasswordPolicy;
  previousPassword: any;
  requirements: any = {
    minLength: false,
    specialCharacter: false,
    number: false,
    uppercase: false,
    lowercase: false
  };

  ngOnInit(): void {

    this.get_Password_Policy();
  }

  canSubmit(): boolean {
    const allFilled = this.previousPassword && this.user.password && this.user.confirmPassword;
    const passwordValid = this.isPasswordValid();
    const passwordsMatch = this.user.password === this.user.confirmPassword;
    return allFilled && passwordValid && passwordsMatch;
  }

  goToHome() {

    this.preUser.username = this.auser.username;
    this.preUser.password = this.previousPassword;
    const userid = localStorage.getItem('aid');
    // this.user_service.authenticate(userid).then(res => {
    //   if (res.status == 200) {
    this.user_service.changePass(this.user).then(response => {
      this.app_service.success_message = 'Password Changed Successfully';
      this.clearMsg();
      this.router.navigate(['pages/dashboard']);
    })
      .catch(err => {
        this.passMatched(err.status);
      });
    //   }
    // })
    // .catch(err => {
    //   this.app_service.errors = 'incorrect old password';
    //   this.clearMsg();
    // });
  }

  passMatched(statusCode: number) {
    if (statusCode === 412) {
      this.app_service.errors = "password has been used prior. Please create a new Password";
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.success_message = '';
      this.app_service.errors = '';
    }, 7000);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

  get_Password_Policy() {
    this.password_policy.get_Policy().then((response: any) => {
      console.log(response);
      if (response) {
        this.policy = response;
      }
    }).catch(error => {
      console.error('Error fetching password policy:', error);
    });
  }

  validatePassword(password: string): void {
    if (this.policy) {
      this.requirements.minLength = password.length >= this.policy.min_length;
      this.requirements.specialCharacter = this.policy.special_character ? /[\W_]/.test(password) : true;
      this.requirements.number = this.policy.min_numbers ? /\d/.test(password) : true;
      this.requirements.uppercase = this.policy.min_uppercase ? /[A-Z]/.test(password) : true;
      this.requirements.lowercase = this.policy.min_lowercase ? /[a-z]/.test(password) : true;
    }
  }

  isPasswordValid(): boolean {
    return Object.values(this.requirements).every(value => value);
  }

}
