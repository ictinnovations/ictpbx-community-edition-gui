import { DataSource } from '@angular/cdk/collections';
import { RingGroupDatabase } from './ring_groups-database.component';
import { RingGroup } from './ring_groups';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class RingGroupDataSource extends DataSource<RingGroup> {

  constructor(
    private _db: RingGroupDatabase,
    private _sort: MatSort,
    private _paginator: MatPaginator
  ) { super(); }

  connect(): Observable<RingGroup[]> {
    return merge(this._db.dataChange, this._sort.sortChange, this._paginator.page).pipe(
      map(() => {
        const sorted = this.getSortedData();
        const start = this._paginator.pageIndex * this._paginator.pageSize;
        return sorted.splice(start, this._paginator.pageSize);
      })
    );
  }

  disconnect() {}

  getSortedData(): RingGroup[] {
    const data = this._db.data.slice();
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let pA: string | number = '';
      let pB: string | number = '';
      switch (this._sort.active) {
        case 'ring_group_name':      [pA, pB] = [a.ring_group_name, b.ring_group_name]; break;
        case 'ring_group_extension': [pA, pB] = [a.ring_group_extension, b.ring_group_extension]; break;
        case 'ring_group_strategy':  [pA, pB] = [a.ring_group_strategy, b.ring_group_strategy]; break;
      }
      const vA = isNaN(+pA) ? pA : +pA;
      const vB = isNaN(+pB) ? pB : +pB;
      return (vA < vB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
