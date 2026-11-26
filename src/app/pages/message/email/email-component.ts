import { Component, OnInit, ViewChild } from '@angular/core';
import { TemplateService } from './email.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { TemplateDatabase } from './email-database.component';
import { TemplateDataSource } from './email-datasource.component';
import { ModalComponent } from '../../../modal.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-email-component',
  templateUrl: './email-component.html',
  styleUrls: ['./email-component.scss'],
})
export class FormsTemplateComponent implements OnInit {

  constructor(private template_service: TemplateService, private modalService: NgbModal) { }

  aTemplate: TemplateDataSource | null;
  length: number;
  closeResult: any;
  displayedColumns = ['ID', 'name', 'type', 'Operations'];

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  ngOnInit() {
    this.getTemplatelist();
  }

  getTemplatelist() {
    this.template_service.get_TemplateList().then(data => {
      this.length = data.length;
      this.aTemplate = new TemplateDataSource(new TemplateDatabase(data), this.sort, this.paginator);
    });
  }

  downloadTemplate(template_id): void {
    this.template_service.get_Templatedownload(template_id);
  }

  deleteTemplate(template_id): void {
    this.template_service.delete_Template(template_id).then(() => { }).catch(this.handleError);
    this.getTemplatelist();
  }

  showStaticModal(name, template_id) {
    const activeModal = this.modalService.open(ModalComponent, { size: 'sm', container: 'nb-layout' });
    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      if (result === 'yes_click') { this.deleteTemplate(template_id); }
    }, (reason) => { });
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
