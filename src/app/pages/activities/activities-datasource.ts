import { activity } from './activity';
import { DataSource } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { ActivitiesDatabase } from './activities-database';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class ActivitiesDataSource extends DataSource<activity> {

  private _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  filteredData: activity[] = [];
  renderedData: activity[] = [];

  constructor(private activitiesDatabase: ActivitiesDatabase, private _sort: MatSort, private _paginator: MatPaginator) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }

  connect(): Observable<activity[]> {
    const displayDataChanges = [
      this.activitiesDatabase.dataChange,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
    ];

    return merge(...displayDataChanges).pipe(map(() => {
      // Filter data
      this.filteredData = this.activitiesDatabase.data.slice().filter((item: activity) => {
        if (item.username == null && item.activities == null) {
          return false;
        }
        const searchStr = (item.username + item.activities).toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      });

      // Sort filtered data
      const sortedData = this.getSortedData(this.filteredData.slice());

      // Grab the page's slice of the filtered sorted data.
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    }));
  }

  disconnect() { }

  getSortedData(data: activity[]): activity[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number|string = '';
      let propertyB: number|string = '';

      switch (this._sort.active) {
        case 'id': [propertyA, propertyB] = [a.id, b.id]; break;
        case 'user_id': [propertyA, propertyB] = [a.user_id, b.user_id]; break;
        case 'username': [propertyA, propertyB] = [a.username, b.username]; break;
        case 'ip_address': [propertyA, propertyB] = [a.ip_address, b.ip_address]; break;
        case 'activities': [propertyA, propertyB] = [a.activities, b.activities]; break;
        case 'date': [propertyA, propertyB] = [a.date, b.date]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'desc' ? 1 : -1);
    });
  }
}
