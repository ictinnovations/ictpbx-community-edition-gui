export class CallFlow {
  call_flow_uuid: string;
  domain_uuid: string;
  dialplan_uuid: string;
  call_flow_name: string = '';
  call_flow_extension: string = '';
  call_flow_feature_code: string = '';
  call_flow_context: string = '';
  call_flow_status: string = 'true';
  call_flow_pin_number: string = '';
  call_flow_label: string = 'Open';
  call_flow_sound: string = '';
  call_flow_app: string = 'transfer';
  call_flow_data: string = '';
  call_flow_alternate_label: string = 'Closed';
  call_flow_alternate_sound: string = '';
  call_flow_alternate_app: string = 'transfer';
  call_flow_alternate_data: string = '';
  call_flow_enabled: boolean = true;
}
