import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../../app.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'ngx-logout',
  templateUrl: './logout.component.html',
})
export class LogoutComponent implements OnInit {

  constructor(private router: Router, private app_service: AppService, private http: HttpClient) {}

  ngOnInit() {
    const user_id  = localStorage.getItem('aid');
    const token    = localStorage.getItem('access_token');

    // Fire-and-forget: notify backend, but don't wait — always clear and redirect
    if (user_id && token) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.post(
        `${this.app_service.apiUrl}/authenticate/cancel/${user_id}`,
        {},
        { headers }
      ).subscribe({ error: () => {} });
    }

    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}
