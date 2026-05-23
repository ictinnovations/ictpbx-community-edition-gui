import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { AppService } from '../app.service';
import 'rxjs/add/operator/toPromise';

export interface DestOption {
  uuid:      string;
  extension: string;
  label:     string;
}

@Injectable({ providedIn: 'root' })
export class PbxDestinationService {

  private cache: Map<string, DestOption[]> = new Map();

  constructor(private http: Http, private app: AppService) {}

  private headers(): RequestOptions {
    const h = new Headers();
    this.app.createAuthorizationHeader(h);
    return new RequestOptions({ headers: h });
  }

  private fetch(url: string, mapFn: (r: any) => DestOption): Promise<DestOption[]> {
    if (this.cache.has(url)) return Promise.resolve(this.cache.get(url));
    return this.http.get(url, this.headers()).toPromise()
      .then(r => {
        const list: DestOption[] = ((r.json() as any[]) || []).map(mapFn);
        this.cache.set(url, list);
        return list;
      })
      .catch(() => []);
  }

  getExtensions(): Promise<DestOption[]> {
    return this.fetch(this.app.apiUrlFpbxExtensions, row => ({
      uuid:      row.extension_uuid,
      extension: row.extension,
      label:     row.extension + (row.effective_caller_id_name ? ' – ' + row.effective_caller_id_name : ''),
    }));
  }

  getRingGroups(): Promise<DestOption[]> {
    return this.fetch(this.app.apiUrlRingGroups, row => ({
      uuid:      row.ring_group_uuid,
      extension: row.ring_group_extension,
      label:     row.ring_group_extension + ' – ' + row.ring_group_name,
    }));
  }

  getIvrMenus(): Promise<DestOption[]> {
    return this.fetch(this.app.apiUrlIvrMenus, row => ({
      uuid:      row.ivr_menu_uuid,
      extension: row.ivr_menu_extension,
      label:     row.ivr_menu_extension + ' – ' + row.ivr_menu_name,
    }));
  }

  getVoicemails(): Promise<DestOption[]> {
    return this.fetch(this.app.apiUrlVoicemails, row => ({
      uuid:      row.voicemail_uuid,
      extension: row.voicemail_id,
      label:     row.voicemail_id + (row.voicemail_mail_to ? ' – ' + row.voicemail_mail_to : ''),
    }));
  }

  getConferences(): Promise<DestOption[]> {
    return this.fetch(this.app.apiUrlConferences, row => ({
      uuid:      row.conference_center_uuid,
      extension: row.conference_center_extension,
      label:     row.conference_center_extension + ' – ' + row.conference_center_name,
    }));
  }

  getCallFlows(): Promise<DestOption[]> {
    return this.fetch(this.app.apiUrlCallFlows, row => ({
      uuid:      row.call_flow_uuid,
      extension: row.call_flow_extension,
      label:     row.call_flow_extension + ' – ' + row.call_flow_name,
    }));
  }

  clearCache(): void {
    this.cache.clear();
  }

  /** Detect the type of a stored destination value by looking it up across all loaded lists. */
  detectType(value: string): 'extension' | 'ring_group' | 'ivr' | 'voicemail' | 'conference' | 'call_flow' | 'external' {
    if (!value) return 'extension';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(value);
    if (!isUuid) return 'extension';
    for (const [url, list] of this.cache.entries()) {
      const found = list.find(o => o.uuid === value);
      if (!found) continue;
      if (url.includes('ring_groups'))  return 'ring_group';
      if (url.includes('ivr_menus'))    return 'ivr';
      if (url.includes('voicemails'))   return 'voicemail';
      if (url.includes('conferences'))  return 'conference';
      if (url.includes('call_flows'))   return 'call_flow';
    }
    return 'extension';
  }
}
