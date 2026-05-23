export class MyAccount {
  account_id: number = 0;
  phone: string = '';
  username: string = '';
  passwd: string = '';
  email: string = '';
  linkdid_id: number | null = null;
  domain: string = '';
  did_phone: string = '';
  pbx_extension: string = '';
  pbx_password: string = '';
  pbx_domain: string = '';
  pbx_extension_uuid: string = '';
  pbx_caller_id_name: string = '';
  pbx_do_not_disturb: boolean = false;
  pbx_forward_all_enabled: boolean = false;
  pbx_forward_all_destination: string = '';
  pbx_forward_busy_enabled: boolean = false;
  pbx_forward_busy_destination: string = '';
  pbx_forward_no_answer_enabled: boolean = false;
  pbx_forward_no_answer_destination: string = '';
}
