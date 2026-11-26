import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IvrService } from './ivr.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { IvrDatabase } from './ivr-database.component';
import { IvrDataSource } from './ivr-datasource.component';
import { ModalComponent } from '../../modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-ivr-component',
  templateUrl: './ivr-component.html',
  styleUrls: ['./ivr-component.scss'],
})
export class FormsIvrComponent implements OnInit {

  constructor(private ivr_service: IvrService, private modalService: NgbModal) { }

  aIvr: IvrDataSource | null;
  length: number;
  displayedColumns = ['ID', 'name', 'Operations'];

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  ngOnInit() {
    this.getIvrList();
  }

  getIvrList() {
    this.ivr_service.get_IvrList().then(data => {
      this.length = data.length;
      this.aIvr = new IvrDataSource(new IvrDatabase(data), this.sort, this.paginator);
    });
  }

  deleteIvr(program_id): void {
    this.ivr_service.delete_Ivr(program_id).then(() => { }).catch(this.handleError);
    this.getIvrList();
  }

  showStaticModal(name, program_id) {
    const activeModal = this.modalService.open(ModalComponent, { size: 'sm', container: 'nb-layout' });
    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      if (result === 'yes_click') { this.deleteIvr(program_id); }
    }, (reason) => { });
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
