import { coverpage } from './coverpage';
import { DataSource } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';
import { MatPaginator } from '@angular/material/paginator';
import { CoverpageDatabase } from './coverpage-database';

import { Observable, merge } from 'rxjs';

export class CoverpageDataSource extends DataSource<coverpage> {

  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  filteredData: coverpage[] = [];
  renderedData: coverpage[] = [];

  constructor(private coverpageDatabase: CoverpageDatabase, private _sort: MatSort,
  private _paginator: MatPaginator) {
    super();

    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }

  connect(): Observable<coverpage[]> {
    const displayDataChanges = [
      this.coverpageDatabase.dataChange,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
    ];
    return merge(...displayDataChanges).map(() => {
      // Filter data
      this.filteredData = this.coverpageDatabase.data.slice().filter((item: coverpage) => {
        if (item.coverpage_id == null && item.title == null) {
          return;
        }
        let searchStr = (item.coverpage_id + item.title).toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) != -1;
      });

      // Sort filtered data
      const sortedData = this.getSortedData(this.filteredData.slice());

      // Grab the page's slice of the filtered sorted data.
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    })
  }

  disconnect() { }
  getSortedData(data): coverpage[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }
    return data.sort((a , b) => {
      let propertyA: number|string = '';
      let propertyB: number|string = '';

      switch (this._sort.active) {
        case 'coverpage_id': [propertyA, propertyB] = [a.coverpage_id, b.coverpage_id]; break;
        case 'title': [propertyA, propertyB] = [a.title, b.title]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) *
      (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
