import { DataSource } from '@angular/cdk/collections';
import { CallQueueDatabase } from './call_queues-database.component';
import { CallQueue } from './call_queues';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class CallQueueDataSource extends DataSource<CallQueue> {

  constructor(
    private _db: CallQueueDatabase,
    private _sort: MatSort,
    private _paginator: MatPaginator
  ) { super(); }

  connect(): Observable<CallQueue[]> {
    return merge(this._db.dataChange, this._sort.sortChange, this._paginator.page).pipe(
      map(() => {
        const sorted = this.getSortedData();
        const start = this._paginator.pageIndex * this._paginator.pageSize;
        return sorted.splice(start, this._paginator.pageSize);
      })
    );
  }

  disconnect() {}

  getSortedData(): CallQueue[] {
    const data = this._db.data.slice();
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let pA: string | number = '';
      let pB: string | number = '';
      switch (this._sort.active) {
        case 'queue_name':      [pA, pB] = [a.queue_name, b.queue_name]; break;
        case 'queue_extension': [pA, pB] = [a.queue_extension, b.queue_extension]; break;
        case 'queue_strategy':  [pA, pB] = [a.queue_strategy, b.queue_strategy]; break;
      }
      const vA = isNaN(+pA) ? pA : +pA;
      const vB = isNaN(+pB) ? pB : +pB;
      return (vA < vB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
