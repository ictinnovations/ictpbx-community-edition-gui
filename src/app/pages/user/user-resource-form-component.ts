import { Component, OnInit, } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { User } from './user';
import { AUserService } from './user.service';
import 'rxjs/add/operator/toPromise';
import { exit } from 'process';


@Component({
  selector: 'ngx-user-resource-form-component',
  templateUrl: './user-resource-form-component.html',
  styleUrls: ['./user-resource-form-component.scss'],
})

export class UserResourceComponent implements OnInit {

  constructor(private route: ActivatedRoute, private user_service: AUserService,
  private router: Router) { }

  user: User = new User;
  user_id: any = null;

  isError = false;
  errorText: any = [];
  
  hours: any = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
  minutes: any = ['00','05','10','15','20','25','30','35','40','45','50','55','59'];
  from_hours: any = '00';
  from_minutes: any = '00';
  to_hours: any = '00';
  to_minutes: any = '00';
  days: any = [];
  timeslot: any;
  allowed_timeslot: any;
  allowed_days: any = [
    {id: 1, name : "Sunday", state : null},
    {id: 2, name : "Monday", state : null},
    {id: 3, name : "Tuesday", state : null},
    {id: 4, name : "Wednesday", state : null},
    {id: 5, name : "Thursday", state : null},
    {id: 6, name : "Friday", state : null},
    {id: 7, name : "Saturday", state : null}
  ];

  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.user_id = +params['id'];
      this.getUserData(this.user_id)
    }); 
  }

  // Get current user data
  getUserData(user_id = null) {
    this.user_service.get_UserData(user_id).then(response => {
      this.user = response;
      // Add user alloswed timeslot
      if (this.user.allowed_timeslot) {
        this.allowed_timeslot =  this.user.allowed_timeslot.split(",")
        this.allowed_timeslot = this.allowed_timeslot.map((value) => value.split(':'))
        this.from_hours = this.allowed_timeslot[0][0];
        this.from_minutes = this.allowed_timeslot[0][1];
        this.to_hours = this.allowed_timeslot[1][0];
        this.to_minutes = this.allowed_timeslot[1][1];
      }
      // Add user allowed days
      if (this.user.allowed_days) {
        const allowedDays = this.user.allowed_days.split(',');
        allowedDays.forEach(element => {
          this.allowed_days.forEach(day => {
            if (element == day.id) day.state = true;
          });
        });
      }

    });
  }

  updateResource(): void {
    // setup timeslot
    this.user.allowed_timeslot = this.from_hours + ":" + this.from_minutes + "," + this.to_hours + ":" + this.to_minutes;
    // setup days
    this.days = [];
    this.allowed_days.forEach(day => { if (day.state == true) this.days.push(day.id); });
    this.user.allowed_days = this.days.toString();
    // Update User
    this.user_service.update_User(this.user).then(() => {
      this.router.navigate(['../../'], {relativeTo: this.route});
    });
  }

  onChange(day_id, is_checked) {
    this.allowed_days.forEach(element => {
      if (day_id == element.id) {
        element.state = is_checked;
      }
    });
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}