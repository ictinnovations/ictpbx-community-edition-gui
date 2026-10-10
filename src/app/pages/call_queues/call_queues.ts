export class CallQueueAgent {
  call_center_agent_uuid: string;
  agent_name: string;
  agent_type: string = 'callback';
  agent_call_timeout: number = 20;
  agent_contact: string;
  agent_status: string = 'Available';
  agent_max_no_answer: number = 3;
  agent_wrap_up_time: number = 10;
  agent_reject_delay_time: number = 30;
  agent_busy_delay_time: number = 60;
  agent_no_answer_delay_time: number = 10;
  agent_description: string;
}

export class CallQueue {
  call_center_queue_uuid: string;
  domain_uuid: string;
  queue_name: string;
  queue_extension: string;
  queue_strategy: string = 'ring-all';
  queue_moh_sound: string;
  queue_time_base_score: string = 'queue';
  queue_time_base_score_sec: number = 0;
  queue_max_wait_time: number = 0;
  queue_max_wait_time_with_no_agent: number = 90;
  queue_max_wait_time_with_no_agent_time_reached: number = 30;
  queue_tier_rules_apply: boolean = false;
  queue_tier_rule_wait_second: number = 300;
  queue_tier_rule_wait_multiply_level: boolean = true;
  queue_tier_rule_no_agent_no_wait: boolean = false;
  queue_discard_abandoned_after: number = 900;
  queue_abandoned_resume_allowed: boolean = false;
  queue_announce_sound: string;
  queue_announce_frequency: number = 0;
  queue_announce_position_frequency: number = 0;
  queue_announce_round_seconds: number = 0;
  queue_announce_holdtime: string = 'true';
  queue_cid_prefix: string;
  queue_terminate_on_cancel: boolean = false;
  queue_agents_can_reject: boolean = true;
  queue_ring_progressively_delay: number = 10;
  queue_timeout_action: string;
  queue_description: string;
  queue_enabled: boolean = true;
  agents: CallQueueAgent[] = [];
  agent_count: number = 0;
}
