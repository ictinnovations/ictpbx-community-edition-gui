export class CDR {
  id: number;
  call_id: string;
  caller_number: string;
  destination: string;
  context: string;
  direction: string;
  call_type: string;
  remote_ip: string;
  last_app: string;
  start_time: string;
  answer_time: string;
  end_time: string;
  duration: number;
  billsec: number;
  hangup_cause: string;
  domain: string;
}
