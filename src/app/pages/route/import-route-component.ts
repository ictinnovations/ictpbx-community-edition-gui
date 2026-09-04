import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouteService } from './route.service';
import { FileUploader , FileUploaderOptions } from 'ng2-file-upload';
import { AppService } from '../../app.service';
import 'rxjs/add/operator/toPromise';
import { Route } from './route';
import { ProviderService } from '../provider/provider.service';
import { Provider } from '../provider/provider';

@Component({
  selector: 'ngx-import-route-component',
  templateUrl: './import-route-component.html',
  styleUrls: ['./import-route-component.scss'],
})

export class ImportRouteComponent implements OnInit {

  constructor(private myroute: ActivatedRoute, private route_service: RouteService,
  private router: Router, private app_service: AppService, private provider_service: ProviderService) { }


  form1: any= {};
  file: any;
  document_id: any;
  route: Route = new Route;

  providers: Provider[] = [];

  URL = `${this.app_service.apiUrlRoutes}/${this.route.service_flag}/${this.route.provider_id}/csv`;
  public uploader: FileUploader = new FileUploader({url: this.URL, disableMultipart: true });

  ngOnInit(): void {

    // GET providers
    this.getProviders();

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
    this.URL = `${this.app_service.apiUrlRoutes}/${this.route.service_flag}/${this.route.provider_id}/csv`;
    this.upload();
    this.router.navigate(['../../route'], {relativeTo: this.myroute});
  }

  upload() {
    this.file.upload();
  }

  sampleCSV(): void {
    this.route_service.getSampleCSV();
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

  getProviders() {
    this.provider_service.get_ProviderList().then(data => {
      this.providers = data;
    })
  }
}
