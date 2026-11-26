export class Extension {
  account_id: number;
  tenant_id: number;
  username: string;
  passwd: string;
  passwd_pin: string;
  first_name: string;
  last_name: string;
  phone: number;
  caller_id_name: string;
  domain: string;
  email: string;
  address: string;
  active: number;
  type: any;
  linkdid_id: number;
  settings : {
    emailtofax_coversheet: any;
  }
  user_id: any;
}

export class Settings {
  value:any;
}
