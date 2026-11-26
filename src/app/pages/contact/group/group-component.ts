import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GroupService } from './group.service';
import {  MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { GroupDatabase } from './group-database.component';
import { GroupDataSource } from './group-datasource.component';
import { ModalComponent } from '../../../modal.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs/Rx';
import { NbWindowRef, NbWindowService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../../app.service';

@Component({
  selector: 'ngx-group-component',
  templateUrl: './group-component.html',
  styleUrls: ['./group-component.scss'],
})


export class FormsGroupComponent implements OnInit {

  constructor(private group_service: GroupService, 
    private modalService: NgbModal,
    private translateService: TranslateService, 
    private windowService: NbWindowService,
    private app_service : AppService
  ) { }

  aGroup: GroupDataSource | null;
  length: number;
  closeResult: any;
  private windowRef: NbWindowRef;


  displayedColumns= ['ID', 'Name', 'contact_total', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild('filter') filter: ElementRef;

  ngOnInit() {
    this.getGrouplist();
  }

  getGrouplist() {
    this.group_service.get_GroupList().then(data => {
      this.length = data.length;
      this.aGroup = new GroupDataSource(new GroupDatabase( data ), this.sort, this.paginator);

      // Observable for the filter
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
     .debounceTime(150)
     .distinctUntilChanged()
     .subscribe(() => {
       if (!this.aGroup) { return; }
       this.aGroup.filter = this.filter.nativeElement.value;
      });

      //Sort the data automatically

      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }


  deleteGroup(group_id): void {
    this.onclose();
    this.group_service.delete_Group(group_id).then(response => {
      this.app_service.success_message = 'Group_ID has been deleted Successfully';
      this.clearMsg();
      this.getGrouplist();
    })
    .catch(err => {
      this.app_service.errors = 'Error while deleting Group_ID';
      this.clearMsg();
  });
  }


  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  // Modal related
  showStaticModal(deleteTemplate,first_name,group_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: { first_name : first_name,group_id: group_id } });
    }); 
  }
  open(content) {
    this.translateService.get('group.group_form.title').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(content, { title: translatedTitle });
    }); 
  }
  onclose() {
    this.windowRef.close();
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

  sampleCSV(): void {
    this.group_service.getSampleCSV();
  }

  getCSV(group_id) {
    this.group_service.getContactCSV(group_id);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
