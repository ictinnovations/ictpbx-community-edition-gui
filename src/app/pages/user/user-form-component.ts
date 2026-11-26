import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { User } from './user';
import { AUserService } from './user.service';
import 'rxjs/add/operator/toPromise';
import { exit } from 'process';
import { AppService } from '../../app.service';
import { PasswordPolicy } from '../password_policy/password_policy';
import { PasswordPolicy_Service } from '../password_policy/password_policy.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'ngx-add-user-component',
  templateUrl: './user-form-component.html',
  styleUrls: ['./user-form-component.scss'],
})

export class AddUserComponent implements OnInit {

  constructor(private route: ActivatedRoute, private user_service: AUserService,
    private router: Router, private app_service: AppService, private password_policy: PasswordPolicy_Service) { }

  // form1: any= {};
  user: User = new User;
  tenant: any;
  user_id: any = null;
  is_admin: any = 0;
  form: FormGroup;
  role: any;
  permissions: any;
  user_permission: any = [];
  tenants: any;
  timezones: any;
  toppings = new FormControl();
  policy: PasswordPolicy = new PasswordPolicy;
  requirements: any = {
    minLength: false,
    specialCharacter: false,
    number: false,
    uppercase: false,
    lowercase: false
  };

  isError = false;
  errorText: any = [];
  isCommunity: boolean = environment.COMMUNITY_EDITION;
  adminPermsHidden: string[] = [];
  // isSuccess = false;
  // successText = null;
  remain_daily: any = 0;
  remain_monthly: any = 0;
  quotaExhausted = false;

  tenantPbxQuotas: any[] = [
    { resource_id: 15, name: 'Extensions',      used: 0, limit: 25, percent: 0, remaining: 25, fieldName: 'quota_extensions',  permKey: 'fpbx_extension' },
    { resource_id: 16, name: 'Devices',         used: 0, limit: 25, percent: 0, remaining: 25, fieldName: 'quota_devices',      permKey: 'devices' },
    { resource_id: 7,  name: 'Ring Groups',     used: 0, limit: 10, percent: 0, remaining: 10, fieldName: 'quota_ring_groups',  permKey: 'ring_groups' },
    { resource_id: 8,  name: 'Call Queues',     used: 0, limit: 5,  percent: 0, remaining: 5,  fieldName: 'quota_call_queues',  permKey: 'call_queues' },
    { resource_id: 17, name: 'IVR Menus',       used: 0, limit: 10, percent: 0, remaining: 10, fieldName: 'quota_ivr_menus',    permKey: 'ivr_menus' },
    { resource_id: 9,  name: 'Voicemail Boxes', used: 0, limit: 50, percent: 0, remaining: 50, fieldName: 'quota_voicemail',    permKey: 'voicemails' },
    { resource_id: 10, name: 'Conferences',     used: 0, limit: 5,  percent: 0, remaining: 5,  fieldName: 'quota_conference',   permKey: 'conferences' },
    { resource_id: 11, name: 'Music on Hold',   used: 0, limit: 20, percent: 0, remaining: 20, fieldName: 'quota_music_on_hold',permKey: 'music_on_hold' },
  ];

  tenantData: any = null;

  private pbxFieldMap: {[key: number]: string} = {
    7:  'quota_ring_groups',
    8:  'quota_call_queues',
    9:  'quota_voicemail',
    10: 'quota_conference',
    11: 'quota_music_on_hold',
    15: 'quota_extensions',
    16: 'quota_devices',
    17: 'quota_ivr_menus',
  };

  private pbxAssignedMap: {[key: number]: string} = {
    7:  'assigned_ring_groups',
    8:  'assigned_call_queues',
    9:  'assigned_voicemail',
    10: 'assigned_conference',
    11: 'assigned_music_on_hold',
    15: 'assigned_extensions',
    16: 'assigned_devices',
    17: 'assigned_ivr_menus',
  };

  private pbxPermKeyMap: {[key: number]: string} = {
    7:  'ring_groups',
    8:  'call_queues',
    9:  'voicemails',
    10: 'conferences',
    11: 'music_on_hold',
    15: 'fpbx_extension',
    16: 'devices',
    17: 'ivr_menus',
  };

  ngOnInit(): void {
    this.get_Password_Policy();

    this.is_admin = Number(localStorage.getItem('is_admin'));
    // Admin defaults to 0 ("New Tenant" sentinel) to force explicit selection
    this.user["tenant_id"] = this.isCommunity ? 1 : (this.is_admin === 1 ? null : Number(localStorage.getItem('tid')));
    if (!this.isCommunity) {
      if (this.is_admin == 1) { this.getAllTenants(); }
      else this.getTenant(this.user.tenant_id);
    }

    // Setting up role for tenant — admin never pre-selects a role; only tenant admin pre-selects End User (4)
    this.getAllRoles(this.is_admin == 1 ? null : (Number(localStorage.getItem('is_tenant')) == 1 ? 4 : null));
    // Get Timezone
    this.getTinezone();

    this.route.params.subscribe(params => {
      this.user_id = +params['id'];
      const test_url = this.router.url.split('/');
      const lastsegment = test_url[test_url.length - 1];
      if (lastsegment === 'new') {
        this.initPermissions(true);
        return null;
      } else {
        return this.user_service.get_UserData(this.user_id).then(data => {
          this.user = data;
          if (this.isCommunity) this.user.tenant_id = 1;
          this.initPermissions(false);
          // Refresh tenant list/limits with the user's actual tenant
          if (!this.isCommunity) {
            if (this.is_admin == 1) this.getAllTenants();
            else this.getTenant(this.user.tenant_id);
          }
        });
      }
    });

  }

  initPermissions(new_user) {
    const callerPerms: string = localStorage.getItem('permission') || '';
    const callerTokens: string[] = this.is_admin === 1
      ? []  // admin has no restrictions
      : (callerPerms ? callerPerms.split(',').map(s => s.trim()) : []);

    const usr_permission = (new_user)
      ? ''
      : (this.user.user_permission)
        ? this.user.user_permission : '';

    const canGrant = (id: string): boolean =>
      this.is_admin === 1 || callerTokens.includes(id);

    this.permissions = [
      // Fax permissions
      { id: "send_fax",        name: "Send Fax",        state: usr_permission.includes("send_fax"),        hidden: !canGrant("send_fax") },
      { id: "receive_fax",     name: "Receive Fax",     state: usr_permission.includes("receive_fax"),     hidden: !canGrant("receive_fax") },
      { id: "fax_to_email",    name: "Fax to Email",    state: usr_permission.includes("fax_to_email"),    hidden: !canGrant("fax_to_email") },
      { id: "email_to_fax",    name: "Email to Fax",    state: usr_permission.includes("email_to_fax"),    hidden: !canGrant("email_to_fax") },
      { id: "personalize_fax", name: "Personalize Fax", state: usr_permission.includes("personalize_fax"), hidden: !canGrant("personalize_fax") },
      { id: "campaigns",       name: "Bulk Fax",        state: usr_permission.includes("campaigns"),       hidden: !canGrant("campaigns") },
      { id: "fax_setting",     name: "Fax Settings",    state: usr_permission.includes("fax_setting"),     hidden: !canGrant("fax_setting") },
      { id: "cover_page",      name: "Cover Page",      state: usr_permission.includes("cover_page"),      hidden: !canGrant("cover_page") },
      { id: "resources.fax_documents", name: "Fax Documents", state: usr_permission.includes("resources.fax_documents"), hidden: !canGrant("resources.fax_documents") },
      // Contacts permissions
      { id: "contacts",        name: "Contacts",        state: usr_permission.split(',').includes("contacts"),   hidden: !canGrant("contacts") },
      { id: "groups",          name: "Contact Groups",  state: usr_permission.split(',').includes("groups"),     hidden: !canGrant("groups") },
      { id: "contact_dnc",     name: "Contact DNC",     state: usr_permission.split(',').includes("contact_dnc"),hidden: !canGrant("contact_dnc") },
      // Fax management
      { id: "extension",       name: "Fax Accounts",    state: usr_permission.split(',').includes("extension"),  hidden: !canGrant("extension") },
      // PBX permissions
      { id: "fpbx_extension",  name: "Extensions",      state: usr_permission.includes("fpbx_extension") },
      { id: "devices",         name: "Devices",         state: usr_permission.includes("devices") },
      { id: "ring_groups",     name: "Ring Groups",     state: usr_permission.includes("ring_groups") },
      { id: "call_queues",     name: "Call Queues",     state: usr_permission.includes("call_queues") },
      { id: "ivr_menus",       name: "IVR Menus",       state: usr_permission.includes("ivr_menus"),       hidden: !canGrant("ivr_menus") },
      { id: "voicemails",      name: "Voicemail",       state: usr_permission.includes("voicemails"),      hidden: !canGrant("voicemails") },
      { id: "conferences",     name: "Conferences",     state: usr_permission.includes("conferences"),     hidden: !canGrant("conferences") },
      { id: "time_conditions", name: "Time Conditions", state: usr_permission.includes("time_conditions"), hidden: !canGrant("time_conditions") },
      { id: "call_flows",      name: "Call Flows",      state: usr_permission.includes("call_flows"),      hidden: !canGrant("call_flows") },
      { id: "call_block",      name: "Call Block",      state: usr_permission.includes("call_block"),      hidden: !canGrant("call_block") },
      { id: "follow_me",       name: "Follow Me",       state: usr_permission.includes("follow_me"),       hidden: !canGrant("follow_me") },
      { id: "music_on_hold",   name: "Music on Hold",   state: usr_permission.includes("music_on_hold"),   hidden: !canGrant("music_on_hold") },
      { id: "inbound_routes",  name: "Inbound Routes",  state: usr_permission.includes("inbound_routes"),  hidden: !canGrant("inbound_routes") },
      { id: "realtime",        name: "Realtime",        state: usr_permission.includes("realtime"),        hidden: !canGrant("realtime") },
    ];
    this.adminPermsHidden = usr_permission.split(',').filter(p => ['user_admin', 'gateways'].includes(p));

    // New user created by admin: default all non-hidden permissions to checked and quotas to 2
    if (new_user && this.is_admin === 1) {
      this.permissions.forEach(p => { if (!p.hidden) p.state = true; });
      this.tenantPbxQuotas.forEach(q => { if (q.fieldName) this.user[q.fieldName] = 2; });
    }

    this.setPermission();
  }
  setPermission() {
    this.user_permission = [];
    this.permissions.forEach(element => {
      if (element.state == true && !element.hidden && this.tenantHasPerm(element.id)) {
        this.user_permission.push(element.id);
      }
    });
    if (this.adminPermsHidden && this.adminPermsHidden.length) {
      this.adminPermsHidden.forEach(p => {
        if (!this.user_permission.includes(p)) this.user_permission.push(p);
      });
    }
  }
  hasPermission(permKey: string): boolean {
    if (!permKey) return true;
    const p = this.permissions?.find(x => x.id === permKey);
    return p ? p.state === true : false;
  }

  private readonly permDeps: {[id: string]: string[]} = {
    email_to_fax:               ['send_fax'],
    personalize_fax:            ['send_fax'],
    campaigns:                  ['send_fax'],
    cover_page:                 ['send_fax'],
    'resources.fax_documents':  ['send_fax'],
    fax_to_email:               ['receive_fax'],
    extension:                  ['receive_fax'],
    groups:                     ['contacts'],
    contact_dnc:                ['contacts'],
    devices:                    ['fpbx_extension'],
    voicemails:                 ['fpbx_extension'],
    follow_me:                  ['fpbx_extension'],
    ring_groups:                ['fpbx_extension'],
    call_queues:                ['fpbx_extension', 'music_on_hold'],
    ivr_menus:                  ['fpbx_extension'],
    time_conditions:            ['fpbx_extension'],
    call_flows:                 ['fpbx_extension'],
    inbound_routes:             ['fpbx_extension'],
  };

  getPerms(keys: string[]) {
    const section = this.permissions.filter(p => keys.includes(p.id));
    if (this.is_admin === 1) {
      // Show all permissions; disabled/enabled state handled in template via tenantHasPerm()
      return section;
    }
    const raw = localStorage.getItem('permission') || '';
    const callerPerms = raw.split(',').map((p: string) => p.trim()).filter(Boolean);
    if (callerPerms.length === 0) return section;
    return section.filter(p => callerPerms.includes(p.id));
  }

  tenantHasPerm(permKey: string): boolean {
    if (!permKey) return true;
    if (this.is_admin === 1) {
      // For super-admin (tenant_id=1) allow everything; otherwise filter by tenant admin's permissions
      if (this.tenantData && Number(this.tenantData.tenant_id) !== 1) {
        const tp = (this.tenantData.tenant_permissions as string || '').split(',').map(p => p.trim()).filter(Boolean);
        if (tp.length > 0) return tp.includes(permKey);
      }
      return true;
    }
    const raw = localStorage.getItem('tenant_permissions') || localStorage.getItem('permission') || '';
    if (!raw) return true;
    return raw.split(',').map((p: string) => p.trim()).includes(permKey);
  }

  checkedPbxQuotas(): any[] {
    if (this.is_admin === 1) {
      return this.tenantPbxQuotas.filter(q => q.permKey);
    }
    return this.tenantPbxQuotas.filter(q =>
      q.permKey && this.tenantHasPerm(q.permKey) && this.hasPermission(q.permKey)
    );
  }

  onPermissionChange(id: string, checked: boolean) {
    const p = this.permissions.find(x => x.id === id);
    if (p) p.state = checked;

    if (checked) {
      (this.permDeps[id] || []).forEach(parentId => {
        const parent = this.permissions.find(x => x.id === parentId);
        if (parent) parent.state = true;
      });
    } else {
      Object.entries(this.permDeps).forEach(([childId, parents]) => {
        if (parents.includes(id)) {
          const child = this.permissions.find(x => x.id === childId);
          if (child) child.state = false;
          // zero quota for auto-unchecked children
          const cq = this.tenantPbxQuotas.find(x => x.permKey === childId);
          if (cq && cq.fieldName) this.user[cq.fieldName] = 0;
        }
      });
      // zero quota for the permission just unchecked
      const q = this.tenantPbxQuotas.find(x => x.permKey === id);
      if (q && q.fieldName) this.user[q.fieldName] = 0;
    }
    this.setPermission();
  }


  get isTenantRoleSelected(): boolean {
    return this.role && this.role.some(r => Number(r.role_id) === 3 && r.state);
  }

  get isEndUserRoleSelected(): boolean {
    return this.role && this.role.some(r => Number(r.role_id) === 4 && r.state);
  }

  get isTenantAdminRoleSelected(): boolean {
    return this.role && this.role.some(r => Number(r.role_id) === 3 && r.state);
  }

  get filteredTenants(): any[] {
    if (!this.tenants) return [];
    return this.isTenantAdminRoleSelected
      ? this.tenants.filter(t => Number(t.tenant_id) !== 1)
      : this.tenants;
  }

  isRoleDisabled(roleId: any): boolean {
    const id = Number(roleId);
    if (id === 1 || id === 3) return this.isEndUserRoleSelected;
    return false;
  }

  getAllRoles(id = null) {
    this.user_service.get_RoleList().then(response => {
      this.role = response;
      // Never expose admin role in the picker
      this.role = this.role.filter(r => Number(r.role_id) !== 2);
      if (this.isCommunity) {
        this.role = this.role.filter(r => (r.name || '').toLowerCase() !== 'tenant');
      }
      this.role.forEach(element => {
        element.state = (id != null && id == element.role_id) ? true : null;
      });
      // When editing, apply the user's actual roles now that the list is ready
      if (this.user_id && this.user_id > 0) {
        this.getUserRoles(this.user_id);
      }
    });
  }

  getAllTenants() {
    this.user_service.get_TenantList().then(response => {
      this.tenants = response;
      this.tenants.forEach(element => {
        element.state = (element.tenant_id === this.user.tenant_id) ? true : null;
      });
      if (this.user.tenant_id) this.updateTenantLimit(this.user.tenant_id);
    });
  }

  getTenant(tenant_id) {
    this.user_service.get_TenantData(tenant_id).then(response => {
      this.tenantData = response;
      this.remain_daily   = (response.daily_limit == -1)   ? 'Unlimited' : Math.max(0, response.daily_limit   - response.assigned_daily);
      this.remain_monthly = (response.monthly_limit == -1) ? 'Unlimited' : Math.max(0, response.monthly_limit - response.assigned_monthly);
      this.quotaExhausted = this.is_admin !== 1
        && this.remain_daily !== 'Unlimited'
        && Number(this.remain_daily) === 0
        && Number(this.remain_monthly) === 0;
      this.computePbxRemaining();
      if (this.is_admin === 1) this.applyTenantFilter();
      return response;
    });
    this.loadTenantPbxQuotas(tenant_id);
  }

  applyTenantFilter() {
    // Uncheck and zero out permissions/quotas the selected tenant doesn't have
    if (this.permissions) {
      this.permissions.forEach(p => { if (!this.tenantHasPerm(p.id)) p.state = false; });
    }
    this.tenantPbxQuotas.forEach(q => {
      if (q.fieldName && !this.tenantHasPerm(q.permKey)) this.user[q.fieldName] = 0;
    });
    this.setPermission();
  }

  loadTenantPbxQuotas(tenant_id) {
    const tid = Number(tenant_id) || 0;
    this.user_service.get_PbxQuota(tid).then(rows => {
      if (Array.isArray(rows) && rows.length) {
        this.tenantPbxQuotas = rows.map(r => ({
          resource_id: r.resource_id,
          name:        r.name,
          used:        r.used  ?? 0,
          limit:       r.limit ?? 0,
          percent:     r.percent ?? 0,
          remaining:   r.limit ?? 0,
          fieldName:   this.pbxFieldMap[r.resource_id] || '',
          permKey:     this.pbxPermKeyMap[r.resource_id] || '',
        }));
        this.computePbxRemaining();
        // Default quota allocation to 2 (or remaining if less) for new users created by admin
        if (!this.user_id && this.is_admin === 1) {
          this.tenantPbxQuotas.forEach(q => {
            if (q.fieldName) this.user[q.fieldName] = Math.min(2, q.remaining);
          });
        }
      }
    });
  }

  computePbxRemaining() {
    this.tenantPbxQuotas = this.tenantPbxQuotas.map(q => {
      const assignedField = this.pbxAssignedMap[q.resource_id];
      const currentUserVal = this.user && this.user[q.fieldName] ? Number(this.user[q.fieldName]) : 0;
      const assignedToAll = (this.tenantData && assignedField) ? Number(this.tenantData[assignedField] || 0) : 0;
      const remaining = Math.max(0, q.limit - assignedToAll + currentUserVal);
      return { ...q, remaining };
    });
  }

  updateTenantLimit(tenant_id) {
    this.loadTenantPbxQuotas(tenant_id);
    this.user_service.get_TenantData(tenant_id).then(r => {
      this.tenantData = r;
      this.computePbxRemaining();
    }).catch(() => {});
    if (this.tenants) {
      const tenantIndex = this.tenants.findIndex(obj => obj.tenant_id === tenant_id);
      if (tenantIndex !== -1) {
        this.tenants[tenantIndex].assigned_daily = this.tenants[tenantIndex].assigned_daily - this.user.daily_limit;
        this.tenants[tenantIndex].assigned_monthly = this.tenants[tenantIndex].assigned_monthly - this.user.monthly_limit;
        this.remain_daily = this.tenants[tenantIndex].daily_limit - this.tenants[tenantIndex].assigned_daily;
        this.remain_monthly = this.tenants[tenantIndex].monthly_limit - this.tenants[tenantIndex].assigned_monthly;
        if (this.tenants[tenantIndex].monthly_limit == -1) {
          this.remain_monthly = 'Unlimited';
        }
        if (this.tenants[tenantIndex].daily_limit == -1) {
          this.remain_daily = 'Unlimited';
        }
      }
    } else {
      this.remain_daily = parseInt(this.remain_daily) + parseInt(this.user.daily_limit);
      this.remain_monthly = parseInt(this.remain_monthly) + parseInt(this.user.monthly_limit);
    }
    this.quotaExhausted = this.is_admin !== 1
      && this.remain_daily !== 'Unlimited'
      && Number(this.remain_daily) === 0
      && Number(this.remain_monthly) === 0;
  }

  getUserRoles(user_id) {
    this.user_service.getUserRoles(user_id).then(response => {
      if (response.length != 0) {
        response.forEach(element => {
          this.role.forEach(roles => {
            if (element.role_id == roles.role_id) {
              roles.state = true;
              if (Number(roles.role_id) === 2 && !this.adminPermsHidden.includes('user_admin')) {
                this.adminPermsHidden.push('user_admin');
                this.setPermission();
              }
            }
          });
        });
      }
    })
  }

  getTinezone() {
    this.user_service.get_Timezone().then(response => {
      this.timezones = response;
    })
  }

  addUser(): void {
    this.checkFields("new");
    if (this.errorText.length === 0) {
      this.user.user_permission = this.user_permission ? this.user_permission.toString() : "null";
      this.user_service.add_User(this.user).then(response => {
        this.setRoles(response);
        this.router.navigate(['../../user'], { relativeTo: this.route });
        this.clearMsg();
      }).catch(err => {
        this.isError = true;
        if (err.status === 409 && err._body) {
          try {
            const body = JSON.parse(err._body);
            this.errorText = [body.error.message];
          } catch {
            this.errorText = ['Validation error'];
          }
        } else {
          this.errorText = ['User Creation Error'];
        }
      });
    } else {
      this.app_service.err_message = 'Error occurred while creating User';
      this.clearMsg();
    }
  }



  updateUser(): void {
    this.checkFields();
    if (this.errorText.length === 0) {
      this.user.user_permission = this.user_permission ? this.user_permission.toString() : "null";
      this.user_service.update_User(this.user).then(() => {
        const myId = Number(localStorage.getItem('aid'));
        const isSelf = Number(this.user.user_id) === myId;
        return this.setRoles(this.user.user_id).then(() => {
          if (isSelf) {
            return this.user_service.get_UserData(this.user.user_id).then((fresh: any) => {
              localStorage.setItem('is_tenant', fresh.is_tenant || '0');
              localStorage.setItem('is_admin', fresh.is_admin || '0');
              localStorage.setItem('permission', fresh.user_permission || '');
            }).catch(() => {});
          }
          return Promise.resolve();
        }).then(() => {
          this.router.navigate(['../../user'], { relativeTo: this.route });
          this.app_service.success_message = 'User updated successfully';
          this.clearMsg();
        });
      }).catch(err => {
        this.isError = true;
        if (err.status === 409 && err._body) {
          try {
            const body = JSON.parse(err._body);
            this.errorText = [body.error.message];
          } catch {
            this.errorText = ['Validation error'];
          }
        } else {
          this.errorText = ['Error occurred while updating User'];
        }
      });
    }
    else {
      this.app_service.err_message = 'Error occurred while updating User';
      this.clearMsg();
    }
  }

  addRoles(user_id, role_id): Promise<any> {
    return this.user_service.setRole(user_id, role_id).catch(() => {});
  }

  setRoles(user_id): Promise<void> {
    // state===null means the row is still loading from getUserRoles; skip it so
    // a fast Update click cannot blast away the user's actual assignments.
    const ops = this.role.map(element => () => {
      if (element.state === true)  return this.addRoles(user_id, element.role_id);
      if (element.state === false) return this.deleteRoles(user_id, element.role_id);
      return Promise.resolve();
    });
    return ops.reduce((chain: Promise<any>, op) => chain.then(() => op()), Promise.resolve());
  }

  onPhoneInput(event: any) {
    event.target.value = event.target.value.replace(/[^0-9+]/g, '');
    if (event.target.value.indexOf('+') > 0) {
      event.target.value = event.target.value.replace(/\+/g, '');
    }
    if (event.target.value.startsWith('+')) {
      event.target.value =
        '+' + event.target.value.substring(1).replace(/\+/g, '');
    }
  }

  deleteRoles(user_id, role_id): Promise<any> {
    return this.user_service.deleteRoles(user_id, role_id).catch(() => {});
  }

  onChange(role_id, is_checked) {
    this.role.forEach(element => {
      if (role_id == element.role_id) {
        element.state = is_checked;
      }
    });
    // Tenant role (3) implies user role (1) must also be active
    if (Number(role_id) === 3 && is_checked) {
      const userRole = this.role.find(r => Number(r.role_id) === 1);
      if (userRole) userRole.state = true;
      // Super Admin tenant is not valid for a Tenant Admin — clear it if selected
      if (Number(this.user.tenant_id) === 1) this.user.tenant_id = null;
    }
    // End-user role (4): uncheck and disable user+tenant; re-enable when unchecked
    if (Number(role_id) === 4) {
      if (is_checked) {
        const userRole   = this.role.find(r => Number(r.role_id) === 1);
        const tenantRole = this.role.find(r => Number(r.role_id) === 3);
        if (userRole)   userRole.state   = false;
        if (tenantRole) tenantRole.state = false;
      }
    }
  }

  onTenantChange(event: number) {
    const id = Number(event);
    this.user.tenant_id = id;
    this.getTenant(id);
    this.tenants.forEach(tenant => {
      if (id == tenant.tenant_id) {
        this.remain_daily   = (tenant.daily_limit == -1)   ? 'Unlimited' : Math.max(0, tenant.daily_limit   - tenant.assigned_daily);
        this.remain_monthly = (tenant.monthly_limit == -1) ? 'Unlimited' : Math.max(0, tenant.monthly_limit - tenant.assigned_monthly);
      }
    });
  }

  private checkFields(status = null): any {
    this.errorHandler(false, [])
    if (!this.user.first_name) this.errorText.push("First name is required.");
    if (status == "new") {
      if (!this.user.password || !this.user.confirmPassword) this.errorText.push("Password is required.");
      if (this.user.password !== this.user.confirmPassword) this.errorText.push("Confirm Password must match with Password.");
    }
    if (!this.user.username) this.errorText.push("Username is required.");
    if (!this.user.email) this.errorText.push("Eamil address is required.");
    if (!this.user.phone) this.errorText.push("Caller ID is required.");
    if (!this.isCommunity && !this.user.tenant_id) this.errorText.push("Please select Tenant.");
    if (this.is_admin != 1 && !this.isCommunity && this.remain_daily !== 'Unlimited' && (Number(this.remain_daily) < this.user.daily_limit || Number(this.remain_monthly) < this.user.monthly_limit)) {
      this.errorText.push("Error: Daily or Monthly limit exceeded.");
    }
    if (this.errorText.length > 0) {
      this.errorHandler(true, this.errorText);
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }

  get_Password_Policy() {
    this.password_policy.get_Policy().then((response: any) => {
      console.log(response);
      if (response) {
        this.policy = response;
      }
    }).catch(error => {
      console.error('Error fetching password policy:', error);
    });
  }

  validatePassword(password: string): void {
    if (this.policy) {
      this.requirements.minLength = password.length >= this.policy.min_length;
      this.requirements.specialCharacter = this.policy.special_character ? /[\W_]/.test(password) : true;
      this.requirements.number = this.policy.min_numbers ? /\d/.test(password) : true;
      this.requirements.uppercase = this.policy.min_uppercase ? /[A-Z]/.test(password) : true;
      this.requirements.lowercase = this.policy.min_lowercase ? /[a-z]/.test(password) : true;
    }
  }

  isPasswordValid(): boolean {
    return Object.values(this.requirements).every(value => value);
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

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}