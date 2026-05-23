export class Did {
  id: number;
  phone: string = '';
  tenant_id: number;
  tenant_name?: string;
  fax_account_id?: number;
  fax_account_name?: string;
  description?: string;
  domain?: string;
  created_at?: string;
}

export class FaxAccount {
  account_id: number;
  username: string;
  description?: string;
}
