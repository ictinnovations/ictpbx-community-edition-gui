import { MenuItem } from './menu-item';
import { environment } from '../../environments/environment';

// ─── PBX children for end users (self-service only) ─────────────────────
const USER_PBX_CHILDREN: MenuItem[] = [
  { title: 'My Extension', icon: 'hash-outline',          link: '/pages/my-account/my-account', key: 'my_account' },
  { title: 'My Devices',   icon: 'monitor-outline',       link: '/pages/devices/devices',        key: 'devices' },
  { title: 'Follow Me',    icon: 'arrow-forward-outline', link: '/pages/follow_me/follow_me',    key: 'follow_me' },
  { title: 'Voicemail',    icon: 'mic-outline',           link: '/pages/voicemails/voicemails',  key: 'voicemails' },
];

// ─── PBX children (shared across admin + tenant menus) ────────────────────
const PBX_CHILDREN: MenuItem[] = [
  { title: 'Extensions',      icon: 'hash-outline',           link: '/pages/fpbx_extension/extensions',       key: 'fpbx_extension' },
  { title: 'Devices',         icon: 'monitor-outline',        link: '/pages/devices/devices',                 key: 'devices' },
  { title: 'Ring Groups',     icon: 'people-outline',         link: '/pages/ring_groups/ring_groups',         key: 'ring_groups' },
  { title: 'Call Queues',     icon: 'list-outline',           link: '/pages/call_queues/call_queues',         key: 'call_queues' },
  { title: 'IVR Menus',       icon: 'keypad-outline',         link: '/pages/ivr_menus/ivr_menus',             key: 'ivr_menus' },
  { title: 'Voicemail',       icon: 'mic-outline',            link: '/pages/voicemails/voicemails',           key: 'voicemails' },
  { title: 'Conferences',     icon: 'video-outline',          link: '/pages/conferences/conferences',         key: 'conferences' },
  { title: 'Time Conditions', icon: 'clock-outline',          link: '/pages/time_conditions/time_conditions', key: 'time_conditions' },
  { title: 'Call Flows',      icon: 'shuffle-2-outline',      link: '/pages/call_flows/call_flows',           key: 'call_flows' },
  { title: 'Call Block',      icon: 'minus-circle-outline',   link: '/pages/call_block/call_block',           key: 'call_block' },
  { title: 'Follow Me',       icon: 'arrow-forward-outline',  link: '/pages/follow_me/follow_me',             key: 'follow_me' },
  { title: 'Music on Hold',   icon: 'headphones-outline',     link: '/pages/music_on_hold/music_on_hold',     key: 'music_on_hold' },
  { title: 'Inbound Routes',  icon: 'arrow-downward-outline', link: '/pages/inbound_routes/inbound_routes',   key: 'inbound_routes' },
  { title: 'Realtime',        icon: 'bar-chart-outline',      link: '/pages/realtime',                        key: 'realtime' },
  { title: 'Feature Codes',  icon: 'hash-outline',           link: '/pages/feature_codes',                   key: 'feature_codes' },
];

// ─── Admin menu ────────────────────────────────────────────────────────────
export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    link: '/pages/dashboard',
    icon: 'home-outline',
    home: true,
    key: 'dashboard',
  },
  {
    title: 'PBX',
    icon: 'phone-outline',
    key: 'pbx',
    children: [
      ...PBX_CHILDREN,
      { title: 'Device Profiles', icon: 'settings-2-outline', link: '/pages/devices/profiles', key: 'device_profiles' },
    ],
  },
  {
    title: 'Fax',
    icon: 'file-text-outline',
    key: 'fax',
    children: [
      { title: 'Bulk Fax',    icon: 'radio-outline',          link: '/pages/campaigns/campaigns',        key: 'campaigns' },
      { title: 'Send Fax',    icon: 'arrow-upward-outline',   link: '/pages/sendfax/sendfax',            key: 'send_fax' },
      { title: 'Receive Fax', icon: 'arrow-downward-outline', link: '/pages/infax',                      key: 'receive_fax' },
      {
        title: 'Contacts',
        icon: 'person-outline',
        key: 'contacts',
        children: [
          { title: 'Contacts',       link: '/pages/contact/contacts',         icon: 'person-add-outline', key: 'contacts' },
          { title: 'Contact Groups', link: '/pages/contact/group',            icon: 'people-outline',     key: 'groups' },
          { title: 'Contact DNC',    link: '/pages/contact_dnc/contact_dnc', icon: 'slash-outline',      key: 'contact_dnc' },
        ],
      },
      {
        title: 'Media Library',
        icon: 'folder-outline',
        key: 'media_library',
        children: [
          { title: 'Fax Documents',    link: '/pages/message/document',  icon: 'file-text-outline',      key: 'resources.fax_documents' },
        ],
      },
      { title: 'Fax Settings', icon: 'settings-outline', link: '/pages/faxsettings',         key: 'fax_setting' },
      { title: 'Cover Page',   icon: 'book-outline',      link: '/pages/coverpage/coverpage', key: 'cover_page' },
      { title: 'My DIDs',      icon: 'sim-card-outline',  link: '/pages/incoming_number/incoming_number',           key: 'incoming_number' },
      { title: 'My CIDs',      icon: 'arrowhead-down-outline', link: '/pages/incoming_cid_number/incoming_cid_number', key: 'my_cids' },
    ],
  },
  {
    title: 'Messaging',
    icon: 'message-square-outline',
    key: 'sms',
    children: [
      { title: 'Inbox',    icon: 'inbox-outline',       link: '/pages/messaging/messaging', key: 'messaging' },
      { title: 'Send SMS', icon: 'paper-plane-outline', link: '/pages/campaigns/sendsms',   key: 'campaigns' },
    ],
  },
  {
    title: 'Routing',
    icon: 'shuffle-2-outline',
    key: 'routings',
    children: [
      { title: 'Trunks',       icon: 'done-all-outline', link: '/pages/provider/provider', key: 'providers' },
      { title: 'Routes',       icon: 'swap-outline',     link: '/pages/route',             key: 'routes' },
      { title: 'DID Numbers',  icon: 'sim-card-outline', link: '/pages/did/did',           key: 'my_dids' },
      { title: 'CID Numbers',  icon: 'person-outline',   link: '/pages/cid/cid',           key: 'cid_number' },
    ],
  },
  {
    title: 'Administration',
    icon: 'settings-2-outline',
    key: 'administration',
    children: [
      { title: 'User Management', icon: 'person-done-outline',  link: '/pages/user/user',       key: 'user' },
      { title: 'Tenants',         icon: 'people-outline',       link: '/pages/tenant/tenant',   key: 'tenants' },
      { title: 'Branding',        icon: 'tv-outline',           link: '/pages/branding',        key: 'branding' },
      { title: 'Password Policy', icon: 'file-outline',         link: '/pages/password_policy', key: 'passwd_policy' },
      { title: 'Announcement',    icon: 'alert-circle-outline', link: '/pages/announcement',    key: 'announcement' },
      { title: 'API Keys',        icon: 'lock-outline',         link: '/pages/api_keys',        key: 'api_keys' },
    ],
  },
  {
    title: 'Billing',
    icon: 'credit-card-outline',
    key: 'billing',
    children: [
      { title: 'Rate Plans',    icon: 'pricetags-outline',   link: '/pages/rate/rate',       key: 'rate' },
      { title: 'Plans',         icon: 'layers-outline',      link: '/pages/plan/plan',       key: 'plan' },
      { title: 'Packages',      icon: 'cube-outline',        link: '/pages/package',         key: 'package' },
      { title: 'Subscriptions', icon: 'people-outline',      link: '/pages/subscription',    key: 'subscription' },
      { title: 'Payments',      icon: 'credit-card-outline', link: '/pages/payment/payment', key: 'payment' },
      { title: 'Quota',         icon: 'pie-chart-outline',   link: '/pages/billing-quota',   key: 'billing_quota' },
      { title: 'Usage',         icon: 'trending-up-outline', link: '/pages/billing-usage',   key: 'billing_usage' },
    ],
  },
  {
    title: 'Reports',
    icon: 'bar-chart-outline',
    key: 'reports',
    children: [
      { title: 'CDR Reports',        icon: 'file-text-outline', link: '/pages/cdr',                   key: 'cdr_reports' },
      { title: 'PBX CDR',             icon: 'phone-outline',     link: '/pages/fpbx_cdr',              key: 'fpbx_cdr' },
      { title: 'System Activities',  icon: 'monitor-outline',   link: '/pages/activities/activities', key: 'activities' },
      { title: 'Statistics Reports', icon: 'bar-chart-outline', link: '/pages/statistic-report',      key: 'stat_reports' },
      { title: 'Extensions CDR',     icon: 'file-text-outline', link: '/pages/users-cdr',             key: 'extensions_cdr' },
    ],
  },
];

// ─── Tenant-admin menu ─────────────────────────────────────────────────────
export const tenantMenuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    link: '/pages/dashboard',
    icon: 'home-outline',
    home: true,
    key: 'dashboard',
  },
  {
    title: 'PBX',
    icon: 'phone-outline',
    key: 'pbx',
    children: PBX_CHILDREN,
  },
  {
    title: 'Fax',
    icon: 'file-text-outline',
    key: 'fax',
    children: [
      { title: 'Bulk Fax',    icon: 'radio-outline',          link: '/pages/campaigns/campaigns',        key: 'campaigns' },
      { title: 'Send Fax',    icon: 'arrow-upward-outline',   link: '/pages/sendfax/sendfax',            key: 'send_fax' },
      { title: 'Receive Fax', icon: 'arrow-downward-outline', link: '/pages/infax',                      key: 'receive_fax' },
      {
        title: 'Contacts',
        icon: 'person-outline',
        key: 'contacts',
        children: [
          { title: 'Contacts',       link: '/pages/contact/contacts',         icon: 'person-add-outline', key: 'contacts' },
          { title: 'Contact Groups', link: '/pages/contact/group',            icon: 'people-outline',     key: 'groups' },
          { title: 'Contact DNC',    link: '/pages/contact_dnc/contact_dnc', icon: 'slash-outline',      key: 'contact_dnc' },
        ],
      },
      {
        title: 'Media Library',
        icon: 'folder-outline',
        key: 'media_library',
        children: [
          { title: 'Fax Documents',    link: '/pages/message/document',  icon: 'file-text-outline', key: 'resources.fax_documents' },
        ],
      },
      { title: 'Fax Settings', icon: 'settings-outline', link: '/pages/faxsettings',         key: 'fax_setting' },
      { title: 'Cover Page',   icon: 'book-outline',      link: '/pages/coverpage/coverpage', key: 'cover_page' },
      { title: 'My DIDs',      icon: 'sim-card-outline',  link: '/pages/incoming_number/incoming_number',           key: 'incoming_number' },
      { title: 'My CIDs',      icon: 'arrowhead-down-outline', link: '/pages/incoming_cid_number/incoming_cid_number', key: 'my_cids' },
    ],
  },
  {
    title: 'Messaging',
    icon: 'message-square-outline',
    key: 'sms',
    children: [
      { title: 'Inbox',    icon: 'inbox-outline',       link: '/pages/messaging/messaging', key: 'messaging' },
      { title: 'Send SMS', icon: 'paper-plane-outline', link: '/pages/campaigns/sendsms',   key: 'campaigns' },
    ],
  },
  {
    title: 'Routing',
    icon: 'shuffle-2-outline',
    key: 'routings',
    children: [
      { title: 'DID Numbers', icon: 'sim-card-outline', link: '/pages/did/did', key: 'my_dids' },
    ],
  },
  {
    title: 'Administration',
    icon: 'settings-2-outline',
    key: 'administration',
    children: [
      { title: 'User Management', icon: 'person-done-outline',  link: '/pages/user/user',    key: 'user' },
      { title: 'Announcement',    icon: 'alert-circle-outline', link: '/pages/announcement', key: 'announcement' },
      { title: 'API Keys',        icon: 'lock-outline',         link: '/pages/api_keys',     key: 'api_keys' },
    ],
  },
  {
    title: 'Billing',
    icon: 'credit-card-outline',
    key: 'billing',
    children: [
      { title: 'Quota', icon: 'pie-chart-outline',   link: '/pages/billing-quota', key: 'billing_quota' },
      { title: 'Usage', icon: 'trending-up-outline', link: '/pages/billing-usage', key: 'billing_usage' },
    ],
  },
  {
    title: 'Reports',
    icon: 'bar-chart-outline',
    key: 'reports',
    children: [
      { title: 'CDR Reports',       icon: 'file-text-outline', link: '/pages/cdr',                   key: 'cdr_reports' },
      { title: 'System Activities', icon: 'monitor-outline',   link: '/pages/activities/activities', key: 'activities' },
    ],
  },
];

// ─── End-user menu (filtered at runtime by permission) ────────────────────
export const userMenuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    link: '/pages/dashboard',
    icon: 'home-outline',
    home: true,
    key: 'dashboard',
  },
  {
    title: 'PBX',
    icon: 'phone-outline',
    key: 'pbx',
    children: USER_PBX_CHILDREN,
  },
  {
    title: 'Fax',
    icon: 'file-text-outline',
    key: 'fax',
    children: [
      { title: 'My Fax Account', icon: 'file-text-outline',     link: '/pages/my-account/my-account',    key: 'my_account' },
      { title: 'Bulk Fax',       icon: 'radio-outline',          link: '/pages/campaigns/campaigns',      key: 'campaigns' },
      { title: 'Send Fax',       icon: 'arrow-upward-outline',   link: '/pages/sendfax/sendfax',          key: 'send_fax' },
      { title: 'Receive Fax',    icon: 'arrow-downward-outline', link: '/pages/infax',                    key: 'receive_fax' },
      {
        title: 'Contacts',
        icon: 'person-outline',
        key: 'contacts',
        children: [
          { title: 'Contacts',       link: '/pages/contact/contacts',         icon: 'person-add-outline', key: 'contacts' },
          { title: 'Contact Groups', link: '/pages/contact/group',            icon: 'people-outline',     key: 'groups' },
          { title: 'Contact DNC',    link: '/pages/contact_dnc/contact_dnc', icon: 'slash-outline',      key: 'contact_dnc' },
        ],
      },
      {
        title: 'Media Library',
        icon: 'folder-outline',
        key: 'media_library',
        children: [
          { title: 'Fax Documents',    link: '/pages/message/document',  icon: 'file-text-outline', key: 'resources.fax_documents' },
        ],
      },
      { title: 'Fax Settings', icon: 'settings-outline', link: '/pages/faxsettings',         key: 'fax_setting' },
      { title: 'Cover Page',   icon: 'book-outline',      link: '/pages/coverpage/coverpage', key: 'cover_page' },
      { title: 'My DIDs',      icon: 'sim-card-outline',  link: '/pages/incoming_number/incoming_number',           key: 'incoming_number' },
      { title: 'My CIDs',      icon: 'arrowhead-down-outline', link: '/pages/incoming_cid_number/incoming_cid_number', key: 'my_cids' },
    ],
  },
  {
    title: 'Messaging',
    icon: 'message-square-outline',
    link: '/pages/messaging/messaging',
    key: 'messaging',
  },
  {
    title: 'Billing',
    icon: 'credit-card-outline',
    key: 'billing',
    children: [
      { title: 'My Quota', icon: 'pie-chart-outline',   link: '/pages/billing-quota', key: 'billing_quota' },
      { title: 'My Usage', icon: 'trending-up-outline', link: '/pages/billing-usage', key: 'billing_usage' },
    ],
  },
  {
    title: 'Reports',
    icon: 'bar-chart-outline',
    key: 'reports',
    children: [
      { title: 'CDR Reports', icon: 'file-text-outline', link: '/pages/cdr', key: 'cdr_reports' },
    ],
  },
];

export const agentMenuItems: MenuItem[] = [
  {
    title: 'Agent Dashboard',
    icon: 'headphones-outline',
    link: '/pages/agent-dashboard',
    home: true,
    key: 'agent_dashboard',
  },
];

// Community Edition: strip multi-tenant + billing + branding entries.
if (environment.COMMUNITY_EDITION) {
  const EE_KEYS = new Set(['tenants', 'branding', 'billing', 'sms', 'messaging']);
  const stripEE = (items: MenuItem[]): MenuItem[] =>
    items
      .filter(item => !EE_KEYS.has(item.key))
      .map(item => (item.children ? { ...item, children: stripEE(item.children) } : item));
  const replace = (arr: MenuItem[]) => {
    const filtered = stripEE(arr);
    arr.length = 0;
    arr.push(...filtered);
  };
  replace(MENU_ITEMS);
  replace(tenantMenuItems);
  replace(userMenuItems);
}
