import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { Rate } from './rate';
import { RateService } from './rate.service';
import 'rxjs/add/operator/toPromise';
import { PlanService } from '../plan/plan.service';
import { Plan } from '../plan/plan';

@Component({
  selector: 'ngx-add-rate-component',
  templateUrl: './rate-form-component.html',
  styleUrls: ['./rate-form-component.scss'],
})

export class AddRateComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private rate_service: RateService,
  private router: Router, private plan_service: PlanService) { }


  form1: any= {};
  rate: Rate= new Rate;
  rate_id: any= null;
  plans: Plan[] = [];

  ngOnInit(): void {
    this.rate.service_flag = 3;
    this.route.params.subscribe(params => {
      this.rate_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        this.rate.active = 1;
        return null;
      } else {
        return this.rate_service.get_RateData(this.rate_id).then(data => {
          this.rate = data;
        });
      }
    });
    this.getPlans();
  }

  addRate(): void {
    
    var myarray = this.rate.destination_id.split(',');

    for(var i = 0; i < myarray.length; i++)
    {
      this.rate.destination_id = myarray[i];
      this.rate_service.add_Rate(this.rate).then(response => {
        this.router.navigate(['../../rate'], {relativeTo: this.route});
      });
    }
    
    
  }

  updateRate(): void {
    this.rate_service.update_Rate(this.rate).then(() => {
      this.router.navigate(['../../rate'], {relativeTo: this.route});
    })
    .catch(this.handleError);
  }

  getPlans() {
    this.plan_service.get_PlanList().then(data => {
      this.plans = data;
    })
    .catch(err => this.handleError(err));

  }
 
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
