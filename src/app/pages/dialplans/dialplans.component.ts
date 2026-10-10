import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'ngx-dialplans',
  template: `
    <nb-card>
      <nb-card-header>Dialplan Editor</nb-card-header>
      <nb-card-body style="padding:0">
        <iframe [src]="iframeUrl" style="width:100%;height:calc(100vh - 200px);border:none;"></iframe>
      </nb-card-body>
    </nb-card>
  `,
})
export class DialplansComponent {
  iframeUrl: SafeResourceUrl;
  constructor(private sanitizer: DomSanitizer) {
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      '/app/dialplans/dialplans.php',
    );
  }
}
