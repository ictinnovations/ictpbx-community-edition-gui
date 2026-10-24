export class RingGroup {
  ring_group_uuid: string;
  domain_uuid: string;
  ring_group_name: string;
  ring_group_extension: string;
  ring_group_greeting: string;
  ring_group_strategy: string;
  ring_group_exit_key: string;
  ring_group_call_timeout: number;
  ring_group_caller_id_name: string;
  ring_group_caller_id_number: string;
  ring_group_cid_name_prefix: string;
  ring_group_cid_number_prefix: string;
  ring_group_timeout_app: string;
  ring_group_timeout_data: string;
  ring_group_forward_destination: string;
  ring_group_forward_enabled: boolean;
  ring_group_distinctive_ring: string;
  ring_group_ringback: string;
  ring_group_call_screen_enabled: boolean;
  ring_group_call_forward_enabled: boolean;
  ring_group_follow_me_enabled: boolean;
  ring_group_missed_call_app: string;
  ring_group_missed_call_data: string;
  ring_group_context: string;
  ring_group_enabled: boolean;
  ring_group_description: string;
  destinations: RingGroupDestination[];
  destination_count: number;
}

export class RingGroupDestination {
  ring_group_destination_uuid: string;
  destination_number: string;
  destination_delay: number;
  destination_timeout: number;
  destination_order: number;
  destination_prompt: boolean;
  destination_enabled: boolean;
  destination_description: string;
}
