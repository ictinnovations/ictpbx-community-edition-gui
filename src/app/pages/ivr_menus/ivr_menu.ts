export class IvrMenu {
  ivr_menu_uuid: string;
  ivr_menu_name: string = '';
  ivr_menu_extension: string = '';
  ivr_menu_language: string = 'en';
  ivr_menu_greet_long: string = null;
  ivr_menu_greet_short: string = null;
  ivr_menu_invalid_sound: string = null;
  ivr_menu_exit_sound: string = null;
  ivr_menu_timeout: number = 10000;
  ivr_menu_exit_app: string = null;
  ivr_menu_exit_data: string = null;
  ivr_menu_max_failures: number = 3;
  ivr_menu_max_timeouts: number = 3;
  ivr_menu_direct_dial: boolean = false;
  ivr_menu_enabled: boolean = true;
  ivr_menu_description: string = null;
  options: IvrMenuOption[] = [];
}

export class IvrMenuOption {
  ivr_menu_option_uuid: string;
  ivr_menu_option_digits: string = '';
  ivr_menu_option_action: string = 'transfer';
  ivr_menu_option_param: string = '';
  ivr_menu_option_order: number = 10;
  ivr_menu_option_description: string = '';
  ivr_menu_option_enabled: boolean = true;
}
