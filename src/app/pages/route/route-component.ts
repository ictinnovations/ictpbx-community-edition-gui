import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RouteService } from './route.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { RouteDatabase } from './route-database.component';
import { RouteDataSource } from './route-datasource.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../modal.component';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'ngx-route-component',
  templateUrl: './route-component.html',
  styleUrls: ['./route-component.scss'],
})

export class RoutesComponent implements OnInit {
  constructor(private route_service: RouteService, private modalService: NgbModal) { }

  aRoute: RouteDataSource | null;
  length: number;
  closeResult: any;
  destinations:any = [];

  displayedColumns= [/*'name',*/ 'destination', 'service', 'provider', 'operations'];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    this.getRoutelist();
  }

  getRoutelist() {
    this.route_service.get_RouteList().then(data => {
      this.length = data.length;
      this.destinations = data;

      this.aRoute = new RouteDataSource(new RouteDatabase( this.destinations ), this.sort, this.paginator);

      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
     .debounceTime(150)
     .distinctUntilChanged()
     .subscribe(() => {
       if (!this.aRoute) { return; }
       this.aRoute.filter = this.filter.nativeElement.value;
      });
    })
    .catch(this.handleError);
  }


  deleteRoute(route_id): void {
    this.route_service.delete_Route(route_id).then(() => {
      this.getRoutelist();
    }).catch(this.handleError);
  }

  // Modal related
  showStaticModal(name, route_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });

    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        this.deleteRoute(route_id);
      }
    }, (reason) => {
      this.closeResult = this.getDismissReason(reason);
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }

  getCSV() {
    this.route_service.getRouteCSV();
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
