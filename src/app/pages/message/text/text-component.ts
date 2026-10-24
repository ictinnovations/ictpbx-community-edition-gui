import { Component, OnInit, ViewChild } from '@angular/core';
import { TextService } from './text.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { TextDatabase } from './text-database.component';
import { TextDataSource } from './text-datasource.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../../modal.component';

@Component({
  selector: 'ngx-text-component',
  templateUrl: './text-component.html',
  styleUrls: ['./text-component.scss'],
})
export class FormsTextComponent implements OnInit {

  constructor(private text_service: TextService, private modalService: NgbModal) { }

  aText: TextDataSource | null;
  length: number;
  closeResult: any;
  displayedColumns = ['ID', 'name', 'type', 'length', 'Operations'];

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  ngOnInit() {
    this.getTextlist();
  }

  getTextlist() {
    this.text_service.get_TextList().then(data => {
      this.length = data.length;
      this.aText = new TextDataSource(new TextDatabase(data), this.sort, this.paginator);
    });
  }

  deleteText(text_id): void {
    this.text_service.delete_Text(text_id).then(() => { }).catch(this.handleError);
    this.getTextlist();
  }

  showStaticModal(name, text_id) {
    const activeModal = this.modalService.open(ModalComponent, { size: 'sm', container: 'nb-layout' });
    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      if (result === 'yes_click') { this.deleteText(text_id); }
    }, (reason) => { });
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
