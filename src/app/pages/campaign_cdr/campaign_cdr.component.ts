import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort,  Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { CampaignCDR } from './campaign_cdr';
import { CampaignCDRService } from './campaign_cdr.service';
import { CampaignCDRDataSource } from './campaign_cdr-datasource.component';
import { CampaignCDRDatabase } from './campaign_cdr-database.component';

@Component({
  selector: 'ngx-campaign_cdr',
  styleUrls: ['./campaign_cdr.component.scss'],
  templateUrl: './campaign_cdr.component.html',
})

export class CampaignCDRComponent implements OnInit {

  aCdr: CampaignCDRDataSource | null;

  length: number;

  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns= ['time_start', 'time_connect', 'time_end', 'contact_phone', 'account_phone', 'status', 'amount', 'pages'];

  constructor(private cdr_service: CampaignCDRService) { }

  ngOnInit() {
    this.getList();
  }

  getList() {
    this.cdr_service.get_CDRlist().then(response => {
      this.length = response.length;

      this.aCdr = new  CampaignCDRDataSource(new CampaignCDRDatabase( response ), this.sort, this.paginator);
      console.log(this.aCdr);

      //Sort the data automatically

      const sortState: Sort = {active: 'time_connect', direction: 'desc'};
      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);

    })
  }  

  sampleCSV(): void {
    this.cdr_service.getSampleCSV();
  }
  
}