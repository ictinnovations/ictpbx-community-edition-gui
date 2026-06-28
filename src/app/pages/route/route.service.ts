import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { Http, RequestOptions, ResponseContentType } from '@angular/http';
import { Route } from './route';
import { AppService } from '../../../app/app.service';
import { saveFile, getFileNameFromResponseContentDisposition } from '../../file-download-helper';
import 'rxjs/add/operator/toPromise';

@Injectable()

export class RouteService {

  aRoute: Route[]= [];
  route_id: any= null;
  route: Route= new Route;

  constructor(private http: Http, private app_service: AppService) {}

  get_ServiceList():any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    return this.http.get(this.app_service.apiUrlServices, options).toPromise()
    .then(response => response.json()).catch(response => this.app_service.handleError(response));
  }

  get_RouteList(): Promise<Route[]> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    return this.http.get(this.app_service.apiUrlRoutes, options).toPromise()
    .then(response => response.json() as Route[]).catch(response => this.app_service.handleError(response));
  }

  get_RouteData(route_id): Promise<Route> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url5 = `${this.app_service.apiUrlRoutes}/${route_id}`;
    return this.http.get(url5, options).toPromise()
    .then(response => response.json() as Route).catch(response => this.app_service.handleError(response));
  }

  get_RouteById(route_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    const url = `${this.app_service.apiUrlRoutes}?route_id=${route_id}`;
    return this.http.get(url, options).toPromise()
    .then(response => (response.json() || [])[0]).catch(response => this.app_service.handleError(response));
  }

  update_Route(route): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(route);
    const updateUrl = `${this.app_service.apiUrlRoutes}/${route.route_id}`;
    return this.http.put(updateUrl, body, options).toPromise().then(response => response)
    .catch(response => this.app_service.handleError(response));
  }

  add_Route(route: Route) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(route);
    const addUrl = `${this.app_service.apiUrlRoutes}`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response.json() )
    .catch(response => this.app_service.handleError(response));
  }

  add_BulkRoutes(routes) {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const body = JSON.stringify(routes);
    const addUrl = `${this.app_service.apiUrlRoutes}/bulk`;
    return this.http.post(addUrl, body, options).toPromise().then(response => response )
    .catch(response => this.app_service.handleError(response));
  }

  delete_Route(route_id): Promise<any> {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const deleteUrl = `${this.app_service.apiUrlRoutes}/${route_id}`;
    return this.http.delete(deleteUrl, options).toPromise().then(response => response.json() as Route)
   .catch(response => this.app_service.handleError(response));
  }

  getSampleCSV() {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    options.responseType = ResponseContentType.Blob;
    const url = `${this.app_service.apiUrlRoutes}/sample/csv`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }

  getRouteCSV(): any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({ headers: headers});
    options.responseType = ResponseContentType.Blob;
    const url = `${this.app_service.apiUrlRoutes}/csv`;
    this.http.get(url, options).subscribe(res => {
      const fileName = getFileNameFromResponseContentDisposition(res);
      saveFile(res.blob(), fileName);
    }, error => {
      this.app_service.downloadError(error);
    });
  }

  get_DestinationData(id = null): any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    // Check if ID available
    const url =  (id) ? `${this.app_service.apiUrlDestination}/${id}` : `${this.app_service.apiUrlDestination}`;
    return this.http.get(url, options).toPromise().then(response => response.json())
   .catch(response => this.app_service.handleError(response));
  }

  get_ProviderData(provider_id = null): any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    // Check if ID available
    const url =  (provider_id) ? `${this.app_service.apiUrlProviders}/${provider_id}` : `${this.app_service.apiUrlProviders}`;
    return this.http.get(url, options).toPromise().then(response => response.json())
   .catch(response => this.app_service.handleError(response));
  }

  get_RegionList():any {    
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const url = `${this.app_service.apiUrlRegion}`;
    return this.http.get(url, options).toPromise().then(response => response.json())
   .catch(response => this.app_service.handleError(response));
  }

  get_CountryList(region_id = null):any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const url =  (region_id) ? `${this.app_service.apiUrlCountry}?region_id=${region_id}` : `${this.app_service.apiUrlCountry}`;
    return this.http.get(url, options).toPromise().then(response => response.json())
   .catch(response => this.app_service.handleError(response));
  }

  get_DestinationList(country_id = null):any {
    const headers = new Headers();
    this.app_service.createAuthorizationHeader(headers);
    const options = new RequestOptions({headers: headers});
    const url =  (country_id) ? `${this.app_service.apiUrlDestination}?country_id=${country_id}` : `${this.app_service.apiUrlDestination}`;
    return this.http.get(url, options).toPromise().then(response => response.json())
   .catch(response => this.app_service.handleError(response));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
