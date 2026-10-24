import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { RateService } from './rate.service';
import { FileUploader , FileUploaderOptions } from 'ng2-file-upload';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/toPromise';
import { PlanService } from '../plan/plan.service';
import { Plan } from '../plan/plan';
import { Rate } from './rate';

@Component({
  selector: 'ngx-import-rate-component',
  templateUrl: './import-rate-component.html',
  styleUrls: ['./import-rate-component.scss'],
})

export class ImportRateComponent implements OnInit {

  constructor(private route: ActivatedRoute, private rate_service: RateService,
  private router: Router, private app_service: AppService, private plan_service: PlanService) { }


  form1: any= {};
  file: any;
  document_id: any;
  rate: Rate = new Rate;

  plans: Plan[] = [];

  URL = `${this.app_service.apiUrlRates}/${this.rate.service_flag}/${this.rate.plan_id}/csv`;
  public uploader: FileUploader = new FileUploader({url: this.URL, disableMultipart: true });

  ngOnInit(): void {

    // GET plans
    this.getPlans();

    this.uploader.onBeforeUploadItem = (item) => {
      item.method = 'POST';
      item.url = this.URL;
      item.withCredentials = false;
    };

    this.uploader.onAfterAddingFile = (response: any) => {
      this.file = response;
    };

    const authHeader = this.app_service.upload_Header;
    const uploadOptions = <FileUploaderOptions>{headers : authHeader};
    this.uploader.setOptions(uploadOptions);

    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => {
    };
  }

  submit(): void {
    this.URL = `${this.app_service.apiUrlRates}/${this.rate.service_flag}/${this.rate.plan_id}/csv`;
    this.upload();
    this.router.navigate(['../../rate'], {relativeTo: this.route});
  }

  upload() {
    this.file.upload();
  }

  sampleCSV(): void {
    this.rate_service.getSampleCSV();
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

  getPlans() {
    this.plan_service.get_PlanList().then(data => {
      this.plans = data;
    })
    .catch(err => this.handleError(err));

  }
}
