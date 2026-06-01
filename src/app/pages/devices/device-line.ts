export class DeviceLine {
  device_line_uuid: string = null;
  device_uuid: string = null;
  extension_uuid: string = null;
  line_number: string = '1';
  server_address: string = '';
  user_id: string = '';
  auth_id: string = '';
  password: string = '';
  display_name: string = '';
  sip_port: string = '5060';
  sip_transport: string = 'udp';
  register_expires: string = '3600';
  enabled: boolean = true;
}
