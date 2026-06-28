export class FpbxCdr {
  xml_cdr_uuid: string = '';
  domain_name: string = '';
  direction: string = '';
  caller_id_name: string = '';
  caller_id_number: string = '';
  destination_number: string = '';
  start_stamp: string = '';
  duration: number = 0;
  billsec: number = 0;
  hangup_cause: string = '';
  missed_call: boolean = false;
}
