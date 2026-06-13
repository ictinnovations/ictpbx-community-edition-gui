import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
})


export class SessionComponent {

  constructor(public activeModal: NgbActiveModal) {}


  stayLoggedIn(): void {
    this.activeModal.close(true); 
  }

  logout() {
    localStorage.clear()
    window.location.reload();
    this.activeModal.close(false); 
  }

  onCancelClick(): void {
    this.activeModal.close(false); 
  }
}
