import { Component, OnInit } from '@angular/core';
import { BrandingService } from './branding.service';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { AppService } from '../../app.service';
import { User } from '../user/user';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { Branding } from './branding';

@Component({
  selector: 'ngx-branding-component',
  templateUrl: './branding-component.html',
  styleUrls: ['./branding-component.scss'],
})

export class BrandingComponent implements OnInit {

  auser: any;
  user: User = new User;
  URL = `${this.app_service.apiUrlBranding}/${this.user.tenant_id}/media`;
  file: any;
  public uploader: FileUploader = new FileUploader({ url: this.URL, disableMultipart: true });
  branding: Branding = new Branding;
  isAdmin_Checked = false;
  is_admin: any = 0;

  tenants: any[] = [];
  selectedTenantId: number | null = null;


  image_error: any = '';
  is_error = false;
  SupportedFile: boolean = false;
  MAX_WIDTH = 480;
  MAX_HEIGHT = 120;
  previewUrl: string | null = null;
  resizeInfo: string = '';
  logoUrl: string | null = null;

  constructor(private branding_service: BrandingService, private authService: NbAuthService, private app_service: AppService) {
    this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken) => {
        if (token && token.getValue()) {
          this.auser = token.getPayload();
          this.user.tenant_id = this.auser.tenant_id;
          this.URL = `${this.app_service.apiUrlBranding}/${this.user.tenant_id}/media`;
          this.getSettings();
        }
      });
  }


  ngOnInit(): void {
    this.is_admin = Number(localStorage.getItem('is_admin'));

    if (this.is_admin === 1) {
      this.app_service.loadTenants().then(list => {
        this.tenants = list;
        if (!this.selectedTenantId && list.length > 0) {
          this.selectedTenantId = list[0].tenant_id;
          this.onTenantChange();
        }
      }).catch(() => {});
    }

    this.uploader.onBeforeUploadItem = (item) => {
      item.method = 'PUT';
      item.url = this.URL;
      item.withCredentials = false;
    };

    this.uploader.onAfterAddingFile = (response: any) => {
      this.file = response;
    };

    const authHeader = this.app_service.upload_Header;
    const uploadOptions = <FileUploaderOptions>{ headers: authHeader };
    this.uploader.setOptions(uploadOptions);

    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => {
      if (status == 200) {
        this.branding.logo = response.replace(/\\/g, '');
        this.saveSettings();
      }
    };
  }

  activeTenantId(): number {
    return (this.is_admin === 1 && this.selectedTenantId) ? this.selectedTenantId : this.user.tenant_id;
  }

  onTenantChange() {
    this.URL = `${this.app_service.apiUrlBranding}/${this.activeTenantId()}/media`;
    this.uploader.setOptions({ url: this.URL });
    this.branding = new Branding();
    this.previewUrl = null;
    this.logoUrl = null;
    this.getSettings();
  }

  getSettings() {
    this.branding_service.get_Branding(this.activeTenantId()).then(response => {
      this.branding.domain = response['domain'];
      this.branding.title = response['title'];
      this.branding.footer = response['footer'];
      this.branding.logo = response['logo'];
      this.branding.favicon_url = response['favicon_url'] || '';
      this.branding.login_subtitle = response['login_subtitle'] || '';
      this.branding.support_email = response['support_email'] || '';
      this.branding.login_bg_url = response['login_bg_url'] || '';
      this.branding.theme_lock = response['theme_lock'] || '';
      if (response && response.logo) {
        this.logoUrl = `${this.app_service.apiUrlBranding}/${this.activeTenantId()}/media`;
      }
      if (response.defaultvalue == 1) {
        this.isAdmin_Checked = true;
      } else {
        this.isAdmin_Checked = false;
      }
    });
  }

  onCheckboxChange(): void {
    if (this.isAdmin_Checked === true) {
      this.branding.defaultvalue = 1;
    } else {
      this.branding.defaultvalue = 0;
    }
  }

  async updateSettings() {
    if (this.SupportedFile) this.file.upload();
    else this.saveSettings();
  }

  isFormValid(): boolean {
    return !!(
      this.branding.domain &&
      this.branding.title &&
      this.branding.footer
    );
  }
  saveSettings() {
    if (this.isAdmin_Checked === true) {
      this.branding.defaultvalue = 1;
    } else {
      this.branding.defaultvalue = 0;
    }
    this.branding_service.add_Branding(this.activeTenantId(), this.branding).then(response => {
      this.app_service.success_message = 'Saved Successfully';
      this.clearMsg();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }).catch(err => {
      this.app_service.errors = 'Error saving configuration';
      this.clearMsg();
    });
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 2000);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e: any) => img.src = e.target.result;

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      let ratio = 1;

      if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
        ratio = Math.min(
          this.MAX_WIDTH / width,
          this.MAX_HEIGHT / height
        );
      }

      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(blob => {
        if (!blob) return;

        const resizedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        this.uploader.clearQueue();
        this.uploader.addToQueue([resizedFile]);
        const preview = canvas.toDataURL(file.type);
        this.logoUrl = preview;
        this.previewUrl = preview;

        this.resizeInfo = `Image resized to ${newWidth} × ${newHeight}`;
        this.SupportedFile = true;
      }, file.type);
    };

    reader.readAsDataURL(file);
  }

}
