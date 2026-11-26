import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RateService } from './rate.service';
import { MatSort,  Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { RateDatabase } from './rate-database.component';
import { RateDataSource } from './rate-datasource.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../modal.component';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'ngx-rate-component',
  templateUrl: './rate-component.html',
  styleUrls: ['./rate-component.scss'],
})


export class FormsRateComponent implements OnInit {
  constructor(private rate_service: RateService, private modalService: NgbModal) { }

  aRate: RateDataSource | null;
  length: number;
  closeResult: any;

  displayedColumns= ['ID', 'Name', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    this.getRatelist();
  }

  getRatelist() {
    this.rate_service.get_RateList().then(data => {
      this.length = data.length;
      this.aRate = new RateDataSource(new RateDatabase( data ), this.sort, this.paginator);

      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
     .debounceTime(150)
     .distinctUntilChanged()
     .subscribe(() => {
       if (!this.aRate) { return; }
       this.aRate.filter = this.filter.nativeElement.value;
      });

      //Sort the data automatically

      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
    .catch(this.handleError);
  }


  deleteRate(rate_id): void {
    this.rate_service.delete_Rate(rate_id).then(response => {
      this.getRatelist();
    })
    .catch(this.handleError);
  }

  // Modal related
  showStaticModal(name, rate_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });

    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        this.deleteRate(rate_id);
      }
    }, (reason) => {
      this.closeResult = this.getDismissReason(reason);
    });
  }

  getCSV() {
    this.rate_service.getRateCSV();
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

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
