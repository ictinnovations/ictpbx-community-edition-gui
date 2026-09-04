export class InboundRoute {
  destination_uuid: string;
  dialplan_uuid: string;
  destination_number: string = '';
  destination_target_type: string = 'extension';
  destination_target: string = '';
  destination_context: string = 'public';
  destination_order: number = 100;
  destination_enabled: boolean = true;
  destination_description: string = null;
  // read-only after save
  destination_data: string = null;
}
