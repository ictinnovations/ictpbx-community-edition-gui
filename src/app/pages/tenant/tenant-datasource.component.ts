import { DataSource } from '@angular/cdk/collections';
import { TenantDatabase } from './tenant-database.component';
import { Tenant } from './tenant';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';

import { Observable, merge } from 'rxjs';

export class TenantDataSource extends DataSource<Tenant> {

  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  filteredData: Tenant[] = [];
  renderedData: Tenant[] = [];

  constructor(private tenantDatabase: TenantDatabase, private _sort: MatSort,
  private _paginator: MatPaginator) {
    super();

    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }

  connect(): Observable<Tenant[]> {
    const displayDataChanges = [
      this.tenantDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page,
    ];
    return merge(...displayDataChanges).map(() => {
      // Filter data
      this.filteredData = this.tenantDatabase.data.slice().filter((item: Tenant) => {
        let searchStr = (item.first_name + item.last_name + item.email + item.phone).toString().toLowerCase();
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
  getSortedData(data): Tenant[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }
    return data.sort((a , b) => {
      let propertyA: number|string = '';
      let propertyB: number|string = '';

      switch (this._sort.active) {
        case 'ID': [propertyA, propertyB] = [a.tenant_id, b.tenant_id]; break;
        case 'first_name': [propertyA, propertyB] = [a.first_name, b.first_name]; break;
        case 'last_name': [propertyA, propertyB] = [a.last_name, b.last_name]; break;
        case 'email': [propertyA, propertyB] = [a.email, b.email]; break;
        case 'phone': [propertyA, propertyB] = [a.phone, b.phone]; break;
        case 'company': [propertyA, propertyB] = [a.company, b.company]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) *
      (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
