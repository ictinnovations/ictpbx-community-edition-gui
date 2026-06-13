import { CDR } from './cdr';
import { DataSource } from '@angular/cdk/collections';
import { MatSort  } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator'; 
import { CDRDatabase } from './cdr-database.component';

import { Observable } from 'rxjs/Rx';

export class CDRDataSource extends DataSource<CDR> {

  constructor(private didDatabase: CDRDatabase, private _sort: MatSort,
  private _paginator: MatPaginator) {
    super();
  }

  connect(): Observable<CDR[]> {
    const displayDataChanges = [
      this.didDatabase.dataChange,
      this._sort.sortChange,
      this._paginator.page,
    ];
    return Observable.merge(...displayDataChanges)
    .map(() => this.getSortedData())
    .map(data => this.paginate(data));
  }

  disconnect() { }
  getSortedData(): CDR[] {
    const data = this.didDatabase.data.slice();
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }
    return data.sort((a , b) => {
      let propertyA: number|string = '';
      let propertyB: number|string = '';

      switch (this._sort.active) {
        case 'start_time':    [propertyA, propertyB] = [a.start_time,    b.start_time];    break;
        case 'direction':     [propertyA, propertyB] = [a.direction,     b.direction];     break;
        case 'call_type':     [propertyA, propertyB] = [a.call_type,     b.call_type];     break;
        case 'caller_number': [propertyA, propertyB] = [a.caller_number, b.caller_number]; break;
        case 'destination':   [propertyA, propertyB] = [a.destination,   b.destination];   break;
        case 'duration':      [propertyA, propertyB] = [a.duration,      b.duration];      break;
        case 'billsec':       [propertyA, propertyB] = [a.billsec,       b.billsec];       break;
        case 'hangup_cause':  [propertyA, propertyB] = [a.hangup_cause,  b.hangup_cause];  break;
        case 'remote_ip':     [propertyA, propertyB] = [a.remote_ip,     b.remote_ip];     break;
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
