import { Component, OnInit, NgModule, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Http, HttpModule, Response } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { Route } from './route';
import { RouteService } from './route.service';
import 'rxjs/add/operator/toPromise';
import { PlanService } from '../plan/plan.service';
import { Plan } from '../plan/plan';
import { Provider } from '../provider/provider';
import { ProviderService } from '../provider/provider.service';

@Component({
  selector: 'ngx-add-route-component',
  templateUrl: './route-form-component.html',
  styleUrls: ['./route-form-component.scss'],
})

export class AddRouteComponent implements OnInit {

  constructor(private http: Http, private routes: ActivatedRoute, private route_service: RouteService,
    private router: Router, private provider_service: ProviderService) { }

  route: Route = new Route;
  route_id: any = null;
  region_id: string;
  country_id: number;
  service_flag: number = 2;
  provider_id: number;
  services: any = [];
  providers: Provider[] = [];
  regions = [];
  countries = [];
  destinations = [];
  available_destinations = [];
  selected_destinations = [];
  isError = false;
  isworking = false;
  isSuccess = false;
  errorText: any = [];
  successText: any;

  ngOnInit(): void {
    this.route.service_flag = 2;
    this.routes.params.subscribe(params => {
      this.route_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        return null;
      } else {
        return this.route_service.get_RouteData(this.route_id).then(data => {
          this.route = data;
        });
      }
    });
    this.getServices();
    this.getProvider();
    this.region_id = 'as.s';
    this.getRegion();
    this.country_id = 586;
  }

  async addRoute() {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.isworking = true;

      // SEND ONE BY ONE
      // for(var i = 0; i < this.selected_destinations.length; i++) {
      //   this.route.destination_id = this.selected_destinations[i].destination_id;
      //   this.route.name = this.selected_destinations[i].name;
      //   this.route_service.add_Route(this.route);
      // }

      // SEND IN BLUCK
      let final_destinations = [];
      for (var i = 0; i < this.selected_destinations.length; i++) {
        // Set object
        const destination = {
          name: this.selected_destinations[i].name,
          destination_id: this.selected_destinations[i].destination_id,
          provider_id: this.provider_id,
          service_flag: this.service_flag
        };
        final_destinations.push(destination);
      }
      const result = await this.route_service.add_BulkRoutes(final_destinations);
      this.successText = result._body.slice(1, -1);
      this.isworking = false;
      this.isSuccess = true;

      // Redirect to route page
      setTimeout(() => {
        this.router.navigate(['../../route'], { relativeTo: this.routes });
      }, 3000);
    } else {
      this.errorHandler(true, this.errorText);
    }
  }

  // Get Services
  getServices() {
    this.services = [
      { "service_flag": "1", "name": "voice", "unit_id": "1" },
      { "service_flag": "2", "name": "fax", "unit_id": "1" },
      // {"service_flag":"4","name":"sms","unit_id":"3"},
      // {"service_flag":"8","name":"email","unit_id":"4"},
      // {"service_flag":"16","name":"video","unit_id":"1"}
    ]
    // this.route_service.get_ServiceList().then(data => {
    //   this.services = data;
    // }).catch(err => this.handleError(err));
  }

  // Get Providers
  getProvider() {
    this.provider_service.get_ProviderList().then(data => {
      this.providers = data;
    }).catch(err => this.handleError(err));
  }

  // Get Region
  getRegion() {
    this.route_service.get_RegionList().then(data => {
      this.regions = data;
      this.getCountry(this.region_id);
    }).catch(err => this.handleError(err));
  }

  // Get Country
  getCountry(region_id: any, reload = false) {
    this.route_service.get_CountryList(region_id).then(data => {
      this.countries = data;
      (reload) ? this.destinations = [] : this.getDestination(this.country_id);
    }).catch(err => this.handleError(err));
  }

  // Get Destination
  getDestination(country_id: any) {
    this.route_service.get_DestinationList(country_id).then(data => {
      this.destinations = data;
      this.setAvailableDestinations();
    }).catch(err => this.handleError(err));
  }

  // Set Service
  setService(service_flag) {
    this.service_flag = service_flag;
  }
  // Set Provider
  setProvider(provider_id) {
    this.provider_id = provider_id;
  }

  // Set Availabel Destinations
  setAvailableDestinations() {
    // Filter available destinations
    if (this.selected_destinations.length > 0) {
      this.available_destinations = this.destinations.filter((available) => {
        return !this.selected_destinations.some((selected) => {
          return selected.destination_id === available.destination_id;
        });
      });
    } else {
      // Set all as available
      this.available_destinations = this.destinations;
    }
  }

  // Set Selected Destinations
  selectDestination(destination: any) {
    if (destination.value) {
      // Remove Destinations
      const destinationIndex = this.available_destinations.findIndex(desti => desti.destination_id == destination.value);
      const current = this.available_destinations.splice(destinationIndex, 1)[0];
      // Add in selected
      this.selected_destinations.push(current);
    }
  }

  // DSelect Destinations
  dSelectDestination(destination: any) {
    if (destination.value) {
      // Remove from selected
      const destinationIndex = this.selected_destinations.findIndex(desti => desti.destination_id == destination.value);
      const current = this.selected_destinations.splice(destinationIndex, 1)[0];
      // Add in Destinations if same country
      // if (this.destinations.some(desti => desti.destination_id === current.destination_id)) {
      this.available_destinations.push(current);
      // }
    }
  }

  // Add all available destinations
  addAllDestination() {
    if (this.available_destinations) {
      this.selected_destinations.push(...this.available_destinations);
      this.available_destinations = [];
    }
  }

  // Remove all selected destinations
  removeAllDestination() {
    this.selected_destinations = [];
    this.available_destinations = this.destinations;
  }

  private checkFields(status = null): any {
    this.errorHandler(false, [])
    if (!this.service_flag) this.errorText.push("Please select service.");
    if (!this.provider_id) this.errorText.push("Please select provider.");
    if (this.selected_destinations.length == 0) this.errorText.push("Please select destination.");
  }

  private errorHandler(status, message): any {
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
