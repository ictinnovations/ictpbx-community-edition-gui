import { Ivr } from './ivr';
import { DataSource } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { IvrDatabase } from './ivr-database.component';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class IvrDataSource extends DataSource<Ivr> {

  constructor(private ivrDatabase: IvrDatabase, private _sort: MatSort,
    private _paginator: MatPaginator) {
    super();
  }

  connect(): Observable<Ivr[]> {
    const displayDataChanges = [
      this.ivrDatabase.dataChange,
      this._sort.sortChange,
      this._paginator.page,
    ];
    return merge(...displayDataChanges).pipe(
      map(() => {
        const sorted = this.getSortedData();
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        return sorted.splice(startIndex, this._paginator.pageSize);
      })
    );
  }

  disconnect() { }

  getSortedData(): Ivr[] {
    const data = this.ivrDatabase.data.slice();
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';
      switch (this._sort.active) {
        case 'ID': [propertyA, propertyB] = [a.program_id, b.program_id]; break;
        case 'name': [propertyA, propertyB] = [a.name, b.name]; break;
      }
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;
      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
