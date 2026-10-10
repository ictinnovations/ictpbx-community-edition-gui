export class CallBlock {
  call_block_uuid: string;
  domain_uuid: string;
  call_block_name: string = '';
  call_block_number: string = '';
  call_block_direction: string = 'inbound';
  call_block_action: string = 'reject';
  call_block_app: string = '';
  call_block_data: string = '';
  call_block_country_code: string = '';
  call_block_enabled: boolean = true;
  call_block_description: string = '';
}
