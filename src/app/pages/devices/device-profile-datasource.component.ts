import { DataSource } from '@angular/cdk/collections';
import { DeviceProfileDatabase } from './device-profile-database.component';
import { DeviceProfile } from './device-profile';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class DeviceProfileDataSource extends DataSource<DeviceProfile> {

  constructor(
    private _db: DeviceProfileDatabase,
    private _sort: MatSort,
    private _paginator: MatPaginator
  ) { super(); }

  connect(): Observable<DeviceProfile[]> {
    return merge(this._db.dataChange, this._sort.sortChange, this._paginator.page).pipe(
      map(() => {
        const sorted = this.getSortedData();
        const start = this._paginator.pageIndex * this._paginator.pageSize;
        return sorted.splice(start, this._paginator.pageSize);
      })
    );
  }

  disconnect() {}

  getSortedData(): DeviceProfile[] {
    const data = this._db.data.slice();
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let pA: string = '';
      let pB: string = '';
      switch (this._sort.active) {
        case 'device_profile_name': [pA, pB] = [a.device_profile_name, b.device_profile_name]; break;
      }
      return (pA < pB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
