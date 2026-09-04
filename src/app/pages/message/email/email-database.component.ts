import { Template } from './email';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class TemplateDatabase {
  dataChange: BehaviorSubject<Template[]> = new BehaviorSubject<Template[]>([]);
  get data(): Template[] { return this.dataChange.value; }

  constructor(private aTemplate: Template[]) {
    this.dataChange.next(aTemplate.slice());
  }
}
