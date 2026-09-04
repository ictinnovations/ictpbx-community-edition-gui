export class Device {
  device_uuid: string;
  domain_uuid: string;
  device_address: string = '';   // MAC address
  device_label: string = null;
  device_vendor: string = null;
  device_model: string = null;
  device_template: string = null;
  device_firmware_version: string = null;
  device_location: string = null;
  device_username: string = null;
  device_password: string = null;
  device_description: string = null;
  device_enabled: boolean = true;
  device_profile_uuid: string = null;
  device_serial_number: string = null;
}
