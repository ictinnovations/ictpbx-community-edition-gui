export class User {
  user_id: number;
  tenant_id: number;
  role_id: number;
  permission_id: number;
  username: string;
  password: any;
  first_name: string;
  last_name: string;
  contact: number;
  phone: number;
  email: string;
  address: string;
  company: string;
  country_id: number;
  cover: any;
  timezone_id: number;
  active: any;
  daily_limit: any = 1000;
  daily_sent: any = 0;
  monthly_limit: any = 1000;
  monthly_sent: any = 0;
  allowed_timeslot: string;
  allowed_days: string;
  confirmPassword: any;
  user_permission: any;
  Account_status: any;
  status: string;
  quota_ring_groups: any;
  quota_call_queues: any;
  quota_voicemail: any;
  quota_conference: any;
  quota_music_on_hold: any;
  quota_extensions: any;
  quota_devices: any;
  quota_ivr_menus: any;
}


