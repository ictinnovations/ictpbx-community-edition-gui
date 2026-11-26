export class Gateway {
  gateway_uuid: string;
  gateway: string = '';
  username: string = null;
  password: string = null;
  realm: string = null;
  from_user: string = null;
  from_domain: string = null;
  proxy: string = null;
  outbound_proxy: string = null;
  expire_seconds: number = 3600;
  register: boolean = true;
  register_transport: string = 'udp';
  retry_seconds: number = 30;
  extension: string = null;
  ping: string = null;
  ping_min: string = null;
  ping_max: string = null;
  caller_id_in_from: boolean = false;
  codec_prefs: string = null;
  context: string = 'public';
  profile: string = 'external';
  enabled: boolean = true;
  description: string = null;
}
