export class VoicemailGreeting {
  voicemail_greeting_uuid: string;
  greeting_id: number;
  greeting_name: string;
  greeting_filename: string;
  greeting_description: string;
}

export class Voicemail {
  voicemail_uuid: string;
  domain_uuid: string;
  voicemail_id: string;
  voicemail_password: string;
  voicemail_mail_to: string;
  voicemail_sms_to: string;
  voicemail_transcription_enabled: boolean = false;
  voicemail_file: string = 'attach';
  voicemail_local_after_email: boolean = true;
  voicemail_tutorial: boolean = false;
  voicemail_recording_instructions: boolean = false;
  voicemail_recording_options: boolean = false;
  voicemail_alternate_greet_id: string;
  voicemail_enabled: boolean = true;
  voicemail_description: string;
  greetings: VoicemailGreeting[] = [];
  greeting_count: number = 0;
}
