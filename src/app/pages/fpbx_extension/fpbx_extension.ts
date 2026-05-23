export class FpbxExtension {
  extension_uuid: string;
  domain_uuid: string;

  // Identity
  extension: string = '';
  number_alias: string = null;
  password: string = null;
  description: string = null;
  enabled: boolean = true;

  // Caller ID
  effective_caller_id_name: string = null;
  effective_caller_id_number: string = null;
  outbound_caller_id_name: string = null;
  outbound_caller_id_number: string = null;
  emergency_caller_id_name: string = null;
  emergency_caller_id_number: string = null;

  // Directory
  directory_first_name: string = null;
  directory_last_name: string = null;
  directory_visible: boolean = true;
  directory_exten_visible: boolean = true;

  // Call behaviour
  call_timeout: number = 30;
  call_group: string = null;
  toll_allow: string = null;
  accountcode: string = null;
  hold_music: string = null;
  user_context: string = null;
  do_not_disturb: boolean = false;
  user_record: string = 'none';
  absolute_codec_string: string = null;
  follow_me_enabled: boolean = false;

  // Call forwarding
  forward_all_enabled: boolean = false;
  forward_all_destination: string = null;
  forward_busy_enabled: boolean = false;
  forward_busy_destination: string = null;
  forward_no_answer_enabled: boolean = false;
  forward_no_answer_destination: string = null;
  forward_user_not_registered_enabled: boolean = false;
  forward_user_not_registered_destination: string = null;

  // Fax account (auto-provisioned)
  fax_email: string = null;

  // User assignment — transient, sent on save to link account.created_by
  user_id: number | null = null;
}
