import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { AppService } from '../../app.service';
import { Tenant } from './tenant';
import { User } from '../user/user';
import { TenantService } from './tenant.service';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import 'rxjs/add/operator/toPromise';


@Component({
  selector: 'ngx-tenant-component',
  templateUrl: './tenant-form-component.html',
  styleUrls: ['./tenant-form-component.scss'],
})

export class AddTenantComponent implements OnInit {

  auser:any;
  user: User = new User;  
  file: any;
  URL = `${this.app_service.apiUrlUsers}/${this.user.user_id}/media`;
  // URL: any;
  public uploader: FileUploader = new FileUploader({url: this.URL, disableMultipart: true });
  // public uploader: any;
  tenant: Tenant = new Tenant;
  timezones: any;
  image_error: any = '';
  is_error = false;
  tenant_id: any= null;
  form: FormGroup;
  role: any;
  logo: any;
  toppings = new FormControl();
  permissions: any;
  tenant_permission: any = [];

  isError = false;
  errorText: any = [];

  constructor(private route: ActivatedRoute, private tenant_service: TenantService,
    private router: Router, private app_service: AppService, private authService: NbAuthService) {
      this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken,
      ) => {
        if (token && token.getValue()) {
          this.user = token.getPayload();
        }
      });
      
      // Set file uploading path and uploader
      this.URL = `${this.app_service.apiUrlUsers}/${this.user.user_id}/media`;
      this.uploader = new FileUploader({url: this.URL, disableMultipart: true });      
    }

  ngOnInit(): void {
    // this.getAllRoles();
    this.route.params.subscribe(params => {
      this.tenant_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        this.initPermissions(true);
        return null;
      } else {
        return this.tenant_service.get_TenantData(this.tenant_id).then(data => {
          this.tenant = data;
          // this.getTenantRoles(this.tenant.tenant_id);
          this.initPermissions(false);
        });
      }
    });

    // Get Timezone
    this.getTimezone();

    this.uploader.onBeforeUploadItem = (item) => {
      item.method = 'PUT';
      item.url = this.URL;
      item.withCredentials = false;
    };

    this.uploader.onAfterAddingFile = (response: any) => {
      this.file = response;
    };

    const authHeader = this.app_service.upload_Header;
    const uploadOptions = <FileUploaderOptions>{headers : authHeader};
    this.uploader.setOptions(uploadOptions);

    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => {
      if (status == 200) {
        // Update logo file name here
        this.tenant.logo_name = response.replace(/\\/g, '');
        // this.logo = response.replace(/\\/g, '');
        // this.tenant_service.update_configuration(this.user.user_id,'site:logo', logo);
      }
    };
  }

   getTimezone() {
    this.tenant_service.get_Timezone().then(response => {
      this.timezones = response;
    })
   }

  initPermissions(new_tenant) {
    const tnt_permission = (new_tenant)
      ? ['mfa_enabled']
      : (this.tenant.permissions)
        ? Object.values(this.tenant.permissions) : '';
        this.permissions = [
          {id:"mfa_enabled",         name:"Enable MFA",          state: tnt_permission.includes("mfa_enabled")},         {id:"password_expiry",            name:"Password Expiry",           state:tnt_permission.includes("password_expiry")},
        ]
        this.setPermission();
  }
  setPermission() {
    this.tenant_permission = [];
    // Loop through each permission and add the id to tenant_permission if the state is true
    this.permissions.forEach(element => {
      if (element.state == true) {
        this.tenant_permission.push(element.id);
      }
    });
  }

  onPermissionChange(permission_id, is_checked) {
    this.permissions.forEach(element => {
      if (permission_id == element.id) {
        element.state = is_checked;
      }
    });
    this.setPermission();
  }

  addTenant(): void {
    this.checkFields("new");
    if (this.errorText.length === 0) {
      this.tenant.permissions = this.tenant_permission ? this.tenant_permission : "null";
      this.tenant_service.add_Tenant(this.tenant).then(response => {
        // this.setRoles(response);
        this.router.navigate(['../../tenant'], {relativeTo: this.route});
        this.app_service.success_message = 'Tenant created succussfully';
        this.clearMsg();
      }).catch(() => {
        this.isError = true;
        this.errorText = ['Failed to save tenant. Please check the form and try again.'];
      });
    }else{
      // validation errors already shown via isError/errorText
    }
  }

  updateTenant(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.tenant.permissions = this.tenant_permission ? this.tenant_permission : "null";
      this.tenant_service.update_Tenant(this.tenant).then(() => {
        // this.setRoles(this.tenant.tenant_id);
        this.router.navigate(['../../tenant'], {relativeTo: this.route});
        this.app_service.success_message = 'Tenant updated successfully';
        this.clearMsg();
      }).catch(() => {
        this.isError = true;
        this.errorText = ['Failed to update tenant. Please check the form and try again.'];
      });
    }else{
      // validation errors already shown via isError/errorText
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 2000);
  }

  onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];

      const img = new Image();
      var maxwidth = 400;
      var maxheight = 90;
      img.src = window.URL.createObjectURL( file );

      img.onload = () => { 
        var imgwidth = img.width;
        var imgheight = img.height;
        // if(imgwidth <= maxwidth && imgheight <= maxheight) {
        if(imgwidth >= maxwidth && imgheight >= maxheight) {
          this.is_error = true;
          this.image_error = "Maximum allowed image width is 400 and maximum allowed height is 90";
          this.removeError();
          event.srcElement.value = null;
        }
        // Upload
        this.upload();
      }

    }
  } 
  
  removeError() {
    setTimeout(() => {
      this.is_error = false;
    }, 2000);
  }

  upload () {
    this.file.upload();
  }

  private checkFields(status = null):any{
    this.errorHandler(false, [])
    if (!this.tenant.company) this.errorText.push("Company name is required.");
    if (!this.tenant.email) this.errorText.push("Email address is required.");
    if (!this.tenant.phone) this.errorText.push("Phone is required.");
    if (this.errorText.length > 0) {
      this.isError = true;
    }
  }

  private errorHandler(status, message):any{
    this.isError = status;
    this.errorText = message;
    if (status) {
      setTimeout(() => {
        this.isError = false;
        this.errorText = [];
      }, 10000);
    }
  }

  // getAllRoles() {
  //   this.tenant_service.get_RoleList().then(response => {
  //     this.role = response;
  //     this.role.forEach(element => {
  //       element.state = null;
  //     });
  //   })
  // }

  // getTenantRoles(tenant_id) {
  //   this.tenant_service.getTenantRoles(tenant_id).then(response => {
  //     if (response.length != 0) {
  //       response.forEach(element => {
  //         this.role.forEach(roles => {
  //           if (element.role_id == roles.role_id) {
  //             roles.state = true;
  //           }
  //         });
  //       });
  //     }
  //   })
  // }

  // addRoles(tenant_id, role_id) {
  //   this.tenant_service.setRole(tenant_id, role_id).then(response => {
  //   })
  // }

  // setRoles(tenant_id) {
  //   this.role.forEach(element => {
  //     if (element.state == true) {
  //       this.addRoles(tenant_id, element.role_id);
  //     }
  //     else if (element.state == null || element.state == false) {
  //       this.deleteRoles(tenant_id, element.role_id);
  //     }
  //   })  
  // }

  // deleteRoles(tenant_id, role_id) {
  //   this.tenant_service.deleteRoles(tenant_id, role_id).then(response => {
  //   })
  // }

  // onChange(role_id, is_checked) {
  //   this.role.forEach(element => {
  //     if (role_id == element.role_id) {
  //       element.state = is_checked;
  //     }
  //   });
  // }
  
}
