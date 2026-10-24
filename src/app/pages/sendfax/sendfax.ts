export class SendFax {
  program_id: number;
  title: string;
  transmission_id: number;
  service_flag: number;
  account_id: number;
  tenant_id: any;
  user_id: any;
  sendcover: any;
  type: any;
  phone: any;
  email: string;
  contact_id: any;
  origin: string;
  direction: string;
  status: string;
  response: string;
  is_read = '1';
  program_type: string;
  try_allowed: any;
  personalize_fax: any;
  fax_from: any;
  fax_to: any;
  job_id: any;
  result: any;
  last_run: string;
  notify = '1';
  active: any;
  contact: {
    phone: any;
  }
  contact_phone: any;
}

export class DocumentProgram {
  program_id: number;
  document_id: any;
  cover_id: number;
  name: string;
}

