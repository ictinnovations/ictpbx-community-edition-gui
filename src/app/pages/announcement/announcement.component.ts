import { Component, OnInit } from '@angular/core';

import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { AppService } from '../../app.service';
import { Http, HttpModule, Response } from '@angular/http';
import { Announcement } from './announcement';
import { AnnnouncementService } from './annnouncement.service';
import { FormsModule } from '@angular/forms';
import 'rxjs/add/operator/toPromise';



@Component({
  selector: 'ngx-announcement',
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss']
})
export class AnnouncementComponent implements OnInit {

  announcement : Announcement = new Announcement;
  tenant_id = localStorage.getItem('tid');
  
  constructor(private http: Http, private route: ActivatedRoute, private announcementservice: AnnnouncementService, private app_service: AppService, private router: Router) { }

  ngOnInit(): void {
    this.getannouncement();
  }

  getannouncement(){
    const tenantid = localStorage.getItem('tid');
    this.announcementservice.getannouncement(tenantid).then( data => {
    this.announcement = data;
    });
  }

  addannouncement(){
    this.announcement.tenant_id = this.tenant_id;
    this.announcementservice.addannouncement(this.announcement).then(response => {
      window.location.reload();
      });
  }
}
