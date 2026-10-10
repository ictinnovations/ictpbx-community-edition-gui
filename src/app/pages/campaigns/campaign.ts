export class Campaign {
  campaign_id: number;
  program_id: number;
  program_type: string;
  group_id: number;
  cpm: number;
  try_allowed: number;
  account_id: number;
  status: string;
  reason: string;
  title: string;
  assign_to: any;
  contact_total: any;
  contact_done: any;
  failed: any;
  successful: any;
}

export class DocumentProgram {
  program_id: number;
  document_id: any;
  cover_id: number;
  name: string;
}
