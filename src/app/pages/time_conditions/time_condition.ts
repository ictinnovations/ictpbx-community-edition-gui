export class TimeCondition {
  dialplan_uuid: string;
  domain_uuid: string;
  tc_name: string = '';
  tc_extension: string = '';
  tc_context: string = '';
  tc_description: string = '';
  tc_enabled: boolean = true;
  tc_time_start: string = '08:00';
  tc_time_stop: string = '17:00';
  tc_wday_start: string = 'mon';
  tc_wday_stop: string = 'fri';
  tc_open_destination: string = '';
  tc_closed_destination: string = '';
}
