
import { StatisticReport } from './statistic-report';
import { DataSource } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { StatisticReportDatabase } from './statistic-report-database.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class StatisticReportDataSource extends DataSource<StatisticReport> {

  private _filterChange = new BehaviorSubject<string>('');

  get tagfilter(): string { return this._filterChange.value; }
  set tagfilter(tagfilter: string) { this._filterChange.next(tagfilter); }

  filteredData: StatisticReport[] = [];
  renderedData: StatisticReport[] = [];

  constructor(private didDatabase: StatisticReportDatabase, private _sort: MatSort,
    private _paginator: MatPaginator) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }

  connect(): Observable<StatisticReport[]> {
    const displayDataChanges = [
      this.didDatabase.dataChange,
      this._sort.sortChange,
      this._paginator.page,
      this._filterChange
    ];
    return merge(...displayDataChanges).pipe(
      map(() => {
        // Filter data
        this.filteredData = this.didDatabase.data.slice().filter((item: StatisticReport) => {
          let searchStr = (item.tags + item.status).toString().toLowerCase();
          return searchStr.indexOf(this.tagfilter.toLowerCase()) !== -1;
        });

        // Sort filtered data
        const sortedData = this.getSortedData(this.filteredData.slice());

        // Grab the page's slice of the filtered sorted data.
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
        return this.renderedData;
      })
    );
    // .map(data => this.paginate(data));
  }

  disconnect() { }
  getSortedData(data): StatisticReport[] {
    //const data = this.didDatabase.data.slice();
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }
    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'time_start': [propertyA, propertyB] = [a.time_start, b.time_start]; break;
        case 'time_connect': [propertyA, propertyB] = [a.time_connect, b.time_connect]; break;
        case 'time_end': [propertyA, propertyB] = [a.time_end, b.time_end]; break;
        case 'first_name': [propertyA, propertyB] = [a.first_name, b.first_name]; break;
        case 'contact_phone': [propertyA, propertyB] = [a.contact_phone, b.contact_phone]; break;
        case 'direction': [propertyA, propertyB] = [a.direction, b.direction]; break;
        case 'company': [propertyA, propertyB] = [a.company, b.company]; break;
        case 'account_phone': [propertyA, propertyB] = [a.account_phone, b.account_phone]; break;
        case 'status': [propertyA, propertyB] = [a.status, b.status]; break;
        case 'cost': [propertyA, propertyB] = [a.cost, b.cost]; break;
        case 'pages': [propertyA, propertyB] = [a.pages, b.pages]; break;
        case 'tags': [propertyA, propertyB] = [a.tags, b.tags]; break;
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
