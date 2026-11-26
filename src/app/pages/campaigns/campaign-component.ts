import { Component, OnInit, ViewChild } from '@angular/core';
import { CampaignService } from './campaign.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { CampaignDatabase } from './campaign-database.component';
import { CampaignDataSource } from './campaign-datasource.component';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { Observable, timer } from 'rxjs';
import { ModalComponent } from '../../modal.component';
import { CampaignCDRService } from '../campaign_cdr/campaign_cdr.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NbWindowRef, NbWindowService } from '@nebular/theme';
import { AppService } from '../../app.service';



@Component({
  selector: 'ngx-campaign-component',
  templateUrl: './campaign-component.html',
  styleUrls: ['./campaign-component.scss'],
})


export class FormsCampaignComponent implements OnInit {

  constructor(private campaign_service: CampaignService, 
  private modalService: NgbModal, 
  private campaign_cdr_service: CampaignCDRService,
  private translateService: TranslateService,
  private windowService: NbWindowService,
  private router: Router,
  public app_service : AppService
) { }

  aCampaign: CampaignDataSource | null;
  length: number;
  private timerSubscription: any;
  private modalRef: NgbModalRef;
  private windowRef: NbWindowRef;
  private WindowService: NbWindowService
  isAdmin = localStorage.getItem('is_admin') === '1';
  tenants: any[] = [];
  selectedTenant = 0;

  closeResult: any;

  displayedColumns= ['ID', 'name', 'status', 'total', 'done', 'successful', 'failed', 'Operations'];

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit() {
    if (this.isAdmin) {
      this.app_service.loadTenants().then(d => this.tenants = d);
    }
    this.app_service.checkFaxProvider();
    this.getCampaignlist();
    this.refreshData();
  }

  getCampaignlist() {
    this.campaign_service.get_CampaignList(this.selectedTenant).then(data => {
      this.length = data.length;

      data.forEach(element => {
        if (element.reason == 'user' || element.reason == 'credit') {
          if (element.reason == 'user') {
            element.status = element.status + '( Stopped by User )'; 
          }
          else {
            element.status = element.status + '( Credit Low )'; 
          }
        }  
      });

      this.aCampaign = new CampaignDataSource(new CampaignDatabase( data ), this.sort, this.paginator);

      //Sort the data automatically

      const sortState: Sort = {active: 'ID', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
    });
  }

  deleteCampaign(campaign_id): void {
    this.closeModal();
    this.campaign_service.delete_Campaign(campaign_id).then(response => {
      this.app_service.success_message = 'Campaign has been deleted successfully.';
      this.clearMsg();
      this.getCampaignlist();
    })
    .catch(err => {
      this.app_service.errors = 'Error occurred while deleting Campaign';
      this.clearMsg();
    });
  }
  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  startCampaign(campaign_id): void {
    this.campaign_service.start_campaign(campaign_id).then(response => {
      this.refreshData();
    });
  }

  private refreshData(): void {
    this.campaign_service.get_CampaignList(this.selectedTenant).then(data => {
      this.length = data.length;

      data.forEach(element => {
        if (element.reason == 'user' || element.reason == 'credit') {
          if (element.reason == 'user') {
            element.status = element.status + '( Stopped by User )'; 
          }
          else {
            element.status = element.status + '( Credit Low )'; 
          }
        }  
      });

      this.aCampaign = new CampaignDataSource(new CampaignDatabase( data ), this.sort, this.paginator);
      this.subscribeToData();
    });
  }

  private subscribeToData(): void {
    this.timerSubscription = timer(5000).first().subscribe(() => this.refreshData());
  }

  stopCampaign(campaign_id): void {
    this.campaign_service.stop_campaign(campaign_id).then(response => {
    });
  }

  // Modal related
  showStaticModal(deleteTemplate,campaign_id) {
    this.translateService.get('transmission.head').subscribe((translatedTitle: string) => {
      this.windowRef = this.windowService.open(deleteTemplate, { title: translatedTitle, context: {campaign_id: campaign_id} });
    }); 
  }

  closeModal() {
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

  cdr_report(campaign_id) {
    this.campaign_cdr_service.campaign_id = campaign_id;
    this.router.navigate(['pages/campaigncdr']);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}



