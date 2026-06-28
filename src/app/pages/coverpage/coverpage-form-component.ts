import { ViewChild, Component, OnInit } from '@angular/core';

import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { AppService } from '../../app.service';
import { Http, HttpModule, Response } from '@angular/http';
import { coverpage } from './coverpage';
import { CoverpageService } from './coverpage-service.service';
import { FormsModule } from '@angular/forms';
import 'rxjs/add/operator/toPromise';
import { QuillEditorComponent } from 'ngx-quill';



@Component({
  selector: 'ngx-coverpage-form-component',
  templateUrl: './coverpage-form-component.html',
  styleUrls: ['./coverpage-form-component.component.scss']
})
export class AddCoverpageComponent implements OnInit {

  @ViewChild('quillEditor') quillEditor!: QuillEditorComponent;

  constructor(private http: Http, private route: ActivatedRoute, private coverpage_service: CoverpageService, private app_service: AppService, private router: Router) { }

  cover: coverpage = new coverpage;
  userid = localStorage.getItem('aid');
  tenant_id = localStorage.getItem('tid');
  coverpage_id: any = null;
  isError = false;
  errorText: any = [];
  editorModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }]
    ],
    clipboard: {
      matchers: [
        ['*', (node, delta) => {
          delta.ops.forEach(op => {
            if (op.attributes) {
              delete op.attributes.color;
              delete op.attributes.background;
            }
          });
          return delta;
        }]
      ]
    }
  };



  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.coverpage_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = this.router.url.split('/').pop();

      if (lastsegment !== 'new') {
        this.coverpage_service.get_Coverpage(this.coverpage_id).then(data => {
          this.cover = data;

          setTimeout(() => {
            if (this.quillEditor?.quillEditor) {
              this.quillEditor.quillEditor.clipboard.dangerouslyPasteHTML(
                this.cover.description || ''
              );
            }
          }, 0);
        });
      }

    });
  }

  addcoverpage() {
    this.cover.created_by = this.userid;
    this.cover.tenant_id = this.tenant_id;
    this.checkFields();
    this.coverpage_service.add_Coverpage(this.cover).then(response => {
      this.router.navigate(['../../coverpage'], { relativeTo: this.route });
      this.app_service.success_message = 'Cover Page created succussfully';
      this.clearMsg();
    })
      .catch(err => {
        this.app_service.errors = 'Error while deleting Cover Page';
        this.clearMsg();
      });

  }

  updateCoverpage(): void {
    this.cover.created_by = this.userid;
    this.cover.tenant_id = this.tenant_id;
    this.checkFields();
    if (this.errorText.length === 0) {
      this.coverpage_service.Update_Coverpage(this.cover).then(() => {
        this.router.navigate(['../../coverpage'], { relativeTo: this.route });
        this.app_service.success_message = 'Cover Page updated successfully';
        this.clearMsg();
      });
    } else {
      this.app_service.err_message = 'Error occurred while updating Cover Page';
      this.clearMsg();
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  private checkFields(status = null): any {
    this.errorHandler(false, [])
    if (!this.cover.title) this.errorText.push("Title is required.");
  }


  private errorHandler(status, message): any {
    this.isError = status;
    this.errorText = message;
    if (status) {
      setTimeout(() => {
        this.isError = false;
        this.errorText = [];
      }, 10000);
    }
  }
}



