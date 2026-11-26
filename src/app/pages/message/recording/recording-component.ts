import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RecordingService } from './recording.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RecordingDatabase } from './recording-database.component';
import { RecordingDataSource } from './recording-datasource.component';
import { ModalComponent } from '../../../modal.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'ngx-recording-component',
  templateUrl: './recording-component.html',
  styleUrls: ['./recording-component.scss'],
})
export class FormsRecordingComponent implements OnInit {

  constructor(private recording_service: RecordingService, private modalService: NgbModal) { }

  aRecording: RecordingDataSource | null;
  length: number;
  recording_id: any;
  closeResult: any;
  displayedColumns = ['ID', 'name', 'type', 'length', 'Operations'];

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('filter', { static: false }) filter: ElementRef;

  ngOnInit() {
    this.getRecordinglist();
  }

  getRecordinglist() {
    this.recording_service.get_RecordingList().then(data => {
      this.length = data.length;
      this.aRecording = new RecordingDataSource(new RecordingDatabase(data), this.sort, this.paginator);
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if (!this.aRecording) { return; }
          this.aRecording.filter = this.filter.nativeElement.value;
        });
    });
  }

  deleteRecording(recording_id): void {
    this.recording_service.delete_Recording(recording_id)
      .then(() => { this.getRecordinglist(); })
      .catch(this.handleError);
  }

  showStaticModal(name, recording_id) {
    const activeModal = this.modalService.open(ModalComponent, { size: 'sm', container: 'nb-layout' });
    activeModal.componentInstance.modalHeader = 'Alert';
    activeModal.componentInstance.modalContent = `Are you sure you want to delete ${name}?`;
    activeModal.result.then((result) => {
      if (result === 'yes_click') { this.deleteRecording(recording_id); }
    }, (reason) => { });
  }

  downloadRecording(recording_id): void {
    this.recording_service.get_Recordingdownload(recording_id);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
