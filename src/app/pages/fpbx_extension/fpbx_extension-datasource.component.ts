import { DataSource } from '@angular/cdk/collections';
import { FpbxExtensionDatabase } from './fpbx_extension-database.component';
import { FpbxExtension } from './fpbx_extension';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class FpbxExtensionDataSource extends DataSource<FpbxExtension> {

  constructor(
    private _db: FpbxExtensionDatabase,
    private _sort: MatSort,
    private _paginator: MatPaginator
  ) { super(); }

  connect(): Observable<FpbxExtension[]> {
    return merge(this._db.dataChange, this._sort.sortChange, this._paginator.page).pipe(
      map(() => {
        const sorted = this.getSortedData();
        const start = this._paginator.pageIndex * this._paginator.pageSize;
        return sorted.splice(start, this._paginator.pageSize);
      })
    );
  }

  disconnect() {}

  getSortedData(): FpbxExtension[] {
    const data = this._db.data.slice();
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let pA: string | number = '';
      let pB: string | number = '';
      switch (this._sort.active) {
        case 'extension':                  [pA, pB] = [a.extension, b.extension]; break;
        case 'effective_caller_id_name':   [pA, pB] = [a.effective_caller_id_name, b.effective_caller_id_name]; break;
      }
      const vA = isNaN(+pA) ? pA : +pA;
      const vB = isNaN(+pB) ? pB : +pB;
      return (vA < vB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
