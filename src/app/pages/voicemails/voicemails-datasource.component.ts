import { DataSource } from '@angular/cdk/collections';
import { VoicemailDatabase } from './voicemails-database.component';
import { Voicemail } from './voicemails';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export class VoicemailDataSource extends DataSource<Voicemail> {

  constructor(
    private _db: VoicemailDatabase,
    private _sort: MatSort,
    private _paginator: MatPaginator
  ) { super(); }

  connect(): Observable<Voicemail[]> {
    return merge(this._db.dataChange, this._sort.sortChange, this._paginator.page).pipe(
      map(() => {
        const sorted = this.getSortedData();
        const start = this._paginator.pageIndex * this._paginator.pageSize;
        return sorted.splice(start, this._paginator.pageSize);
      })
    );
  }

  disconnect() {}

  getSortedData(): Voicemail[] {
    const data = this._db.data.slice();
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let pA: string | number = '';
      let pB: string | number = '';
      switch (this._sort.active) {
        case 'voicemail_id':      [pA, pB] = [a.voicemail_id, b.voicemail_id]; break;
        case 'voicemail_mail_to': [pA, pB] = [a.voicemail_mail_to, b.voicemail_mail_to]; break;
      }
      const vA = isNaN(+pA) ? pA : +pA;
      const vB = isNaN(+pB) ? pB : +pB;
      return (vA < vB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
