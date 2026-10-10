export class FollowMeDestination {
  follow_me_destination_uuid: string;
  follow_me_destination: string = '';
  follow_me_delay: number = 0;
  follow_me_timeout: number = 30;
  follow_me_prompt: string = 'false';
  follow_me_order: number = 10;
}

export class FollowMe {
  follow_me_uuid: string;
  domain_uuid: string;
  extension_uuid: string = '';
  extension_number: string = '';
  cid_name_prefix: string = '';
  cid_number_prefix: string = '';
  dial_string: string = '';
  follow_me_enabled: boolean = false;
  follow_me_ignore_busy: boolean = false;
  destinations: FollowMeDestination[] = [];
}
