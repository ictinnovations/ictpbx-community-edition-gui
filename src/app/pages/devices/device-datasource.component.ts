import { DataSource } from '@angular/cdk/collections';
import { DeviceDatabase } from './device-database.component';
import { Device } from './device';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class DeviceDataSource extends DataSource<Device> {

  constructor(
    private _db: DeviceDatabase,
    private _sort: MatSort,
    private _paginator: MatPaginator
  ) { super(); }

  connect(): Observable<Device[]> {
    return merge(this._db.dataChange, this._sort.sortChange, this._paginator.page).pipe(
      map(() => {
        const sorted = this.getSortedData();
        const start = this._paginator.pageIndex * this._paginator.pageSize;
        return sorted.splice(start, this._paginator.pageSize);
      })
    );
  }

  disconnect() {}

  getSortedData(): Device[] {
    const data = this._db.data.slice();
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let pA: string = '';
      let pB: string = '';
      switch (this._sort.active) {
        case 'device_label':   [pA, pB] = [a.device_label, b.device_label]; break;
        case 'device_address': [pA, pB] = [a.device_address, b.device_address]; break;
        case 'device_vendor':  [pA, pB] = [a.device_vendor, b.device_vendor]; break;
      }
      return (pA < pB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
