import { CampaignCDR } from './campaign_cdr';
import { DataSource } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { CampaignCDRDatabase } from './campaign_cdr-database.component';

import { Observable } from 'rxjs/Rx';

export class CampaignCDRDataSource extends DataSource<CampaignCDR> {

  constructor(private cdrDatabase: CampaignCDRDatabase, private _sort: MatSort,
  private _paginator: MatPaginator) {
    super();
  }

  connect(): Observable<CampaignCDR[]> {
    const displayDataChanges = [
      this.cdrDatabase.dataChange,
      this._sort.sortChange,
      this._paginator.page,
    ];
    return Observable.merge(...displayDataChanges)
    .map(() => this.getSortedData())
    .map(data => this.paginate(data));
  }

  disconnect() { }
  getSortedData(): CampaignCDR[] {
    const data = this.cdrDatabase.data.slice();
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }
    return data.sort((a , b) => {
      let propertyA: number|string = '';
      let propertyB: number|string = '';

      switch (this._sort.active) {
        case 'time_start': [propertyA, propertyB] = [a.time_start, b.time_start]; break;
        case 'time_connect': [propertyA, propertyB] = [a.time_connect, b.time_connect]; break;
        case 'time_end': [propertyA, propertyB] = [a.time_end, b.time_end]; break;
        case 'contact_phone': [propertyA, propertyB] = [a.contact_phone, b.contact_phone]; break;
        case 'account_phone': [propertyA, propertyB] = [a.account_phone, b.account_phone]; break;
        case 'status': [propertyA, propertyB] = [a.status, b.status]; break;
        case 'amount': [propertyA, propertyB] = [a.amount, b.amount]; break;
        case 'pages': [propertyA, propertyB] = [a.pages, b.pages]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) *
      (this._sort.direction === 'asc' ? 1 : -1);
    });
  }

  paginate(data) {
    const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
    return data.splice(startIndex, this._paginator.pageSize);
  }
}
