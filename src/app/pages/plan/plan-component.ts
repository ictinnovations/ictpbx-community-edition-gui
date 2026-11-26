import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PlanService } from './plan.service';
import { MatSort,  Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator'; 
import { PlanDatabase } from './plan-database.component';
import { PlanDataSource } from './plan-datasource.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../modal.component';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'ngx-plan-component',
  templateUrl: './plan-component.html',
  styleUrls: ['./plan-component.scss'],
})


export class FormsPlanComponent implements OnInit {
  constructor(private plan_service: PlanService, private modalService: NgbModal) { }

  aPlan: PlanDataSource | null;
  length: number;
  closeResult: any;

  displayedColumns= ['ID', 'Name', 'description', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    this.getPlanlist();
  }

  getPlanlist() {
    this.plan_service.get_PlanList().then(data => {
      this.length = data.length;
      this.aPlan = new PlanDataSource(new PlanDatabase( data ), this.sort, this.paginator);

      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
     .debounceTime(150)
     .distinctUntilChanged()
     .subscribe(() => {
       if (!this.aPlan) { return; }
       this.aPlan.filter = this.filter.nativeElement.value;
      });

      //Sort the data automatically

      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
    .catch(this.handleError);
  }


  deletePlan(plan_id): void {
    this.plan_service.delete_Plan(plan_id).then(response => {
      this.getPlanlist();
    })
    .catch(this.handleError);
  }

  // Modal related
  showStaticModal(name, plan_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });

    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        this.deletePlan(plan_id);
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

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
