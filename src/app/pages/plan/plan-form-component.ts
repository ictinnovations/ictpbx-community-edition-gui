import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { Plan } from './plan';
import { PlanService } from './plan.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-add-plan-component',
  templateUrl: './plan-form-component.html',
  styleUrls: ['./plan-form-component.scss'],
})

export class AddPlanComponent implements OnInit {

  constructor(private http: Http, private route: ActivatedRoute, private plan_service: PlanService,
  private router: Router) { }


  form1: any= {};
  plan: Plan= new Plan;
  plan_id: any= null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.plan_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.plan_service.get_PlanData(this.plan_id).then(data => {
          this.plan = data;
        });
      }
    });
  }

  addPlan(): void {
    this.plan_service.add_Plan(this.plan).then(response => {
      this.router.navigate(['../../plan'], {relativeTo: this.route});
    });
  }

  updatePlan(): void {
    this.plan_service.update_Plan(this.plan).then(() => {
      this.router.navigate(['../../plan'], {relativeTo: this.route});
    })
    .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
