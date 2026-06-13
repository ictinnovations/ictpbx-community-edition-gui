export class MusicOnHold {
  music_on_hold_uuid: string;
  domain_uuid: string;
  music_on_hold_name: string;
  music_on_hold_path: string;
  music_on_hold_rate: number = 8000;
  music_on_hold_shuffle: string = 'true';
  music_on_hold_channels: number = 1;
  music_on_hold_interval: number = 20;
  music_on_hold_timer_name: string = 'soft';
  music_on_hold_chime_list: string;
  music_on_hold_chime_freq: number = 0;
  music_on_hold_chime_max: number = 0;
}
