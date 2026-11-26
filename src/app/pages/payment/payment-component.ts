import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PaymentService } from './payment.service';
import { MatSort , Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { PaymentDatabase } from './payment-database.component';
import { PaymentDataSource } from './payment-datasource.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../modal.component';
import { Observable } from 'rxjs/Rx';
import { AppService } from '../../app.service';

@Component({
  selector: 'ngx-payment-component',
  templateUrl: './payment-component.html',
  styleUrls: ['./payment-component.scss'],
})


export class FormsPaymentComponent implements OnInit {
  constructor(private payment_service: PaymentService, private modalService: NgbModal,
  private app_service: AppService) { }

  aPayment: PaymentDataSource | null;
  length: number;
  closeResult: any;
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;


  displayedColumns= ['ID', 'UserName', 'PaidAmount', 'PaidDate'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
    }
    this.getPaymentlist();
  }

  getPaymentlist() {
    this.payment_service.get_PaymentList(this.selectedTenant).then(data => {
      this.length = data.length;
      this.aPayment = new PaymentDataSource(new PaymentDatabase(data), this.sort, this.paginator);

      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if (!this.aPayment) { return; }
          this.aPayment.filter = this.filter.nativeElement.value;
        });

      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    })
    .catch(this.handleError);
  }

  deletePayment(payment_id): void {
    this.payment_service.delete_Payment(payment_id).then(response => {
      this.getPaymentlist();
    })
    .catch(this.handleError);
  }

  // Modal related
  showStaticModal(name, payment_id) {
    const activeModal = this.modalService.open(ModalComponent, {
      size: 'sm',
      container: 'nb-layout',
    });

    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      this.closeResult = result;
      if (this.closeResult === 'yes_click') {
        this.deletePayment(payment_id);
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
