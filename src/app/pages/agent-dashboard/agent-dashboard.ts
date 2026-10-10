export class AgentDashboard {
  username: string;
  password: string;
  callerid: string;
  host: string;
  port: string;
  wss: string;
  dialplan: Dialplan;
}

export interface Dialplan {
  agent_login: string;
  voicemail: string;
}
