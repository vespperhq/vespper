export interface PagerDutyGetTokenPayload {
  grant_type: "authorization_code" | "refresh_token";
  client_id: string;
  client_secret: string;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

export interface PagerDutyWebhookEvent {
  event: {
    id: string;
    event_type: string;
    resource_type: string;
    occurred_at: string;
    agent: {
      html_url: string;
      id: string;
      self: string;
      summary: string;
      type: string;
    };
    client: {
      name: string;
    };
    data: {
      id: string;
      type: string;
      self: string;
      html_url: string;
      number: number;
      status: string;
      incident_key: string;
      created_at: string;
      title: string;
      service: {
        html_url: string;
        id: string;
        self: string;
        summary: string;
        type: string;
      };
      assignees: {
        html_url: string;
        id: string;
        self: string;
        summary: string;
        type: string;
      }[];
      escalation_policy: {
        html_url: string;
        id: string;
        self: string;
        summary: string;
        type: string;
      };
      teams: {
        html_url: string;
        id: string;
        self: string;
        summary: string;
        type: string;
      }[];
      priority: {
        html_url: string;
        id: string;
        self: string;
        summary: string;
        type: string;
      };
      urgency: string;
      conference_bridge: {
        conference_number: string;
        conference_url: string;
      };
      resolve_reason: null | string;
    };
  };
}

export interface PagerDutyUser {
  id: string;
  type: string;
  summary: string;
  self: string;
  html_url: string;
  name: string;
  email: string;
  time_zone: string;
  color: string;
  role: string;
  avatar_url: string;
  description: string;
  invitation_sent: boolean;
  contact_methods: {
    id: string;
    type: string;
    summary: string;
    self: string;
  }[];
  notification_rules: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  }[];
  job_title: string;
  teams: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  }[];
}

export interface PagerDutyLogEntry {
  id: string;
  type: string;
  summary: string;
  self: string;
  html_url: string;
  created_at: string;
  agent: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  };
  channel: {
    type: string;
    service_key: string;
    description: string;
    incident_key: string;
    details: {
      Application: string;
      CompanyId: number;
      Computer: string;
      Description: string;
      "Ip Address": string;
      "Log Text": string;
      Subsystem: string;
      Timestamp: string;
      alert_unique_identifier: string;
      edit_alert_url: string;
      related_logs_url: string;
    };
    cef_details: {
      client: string;
      client_url: string;
      contexts: {
        alt: string;
        href: string;
        src: string;
        type: string;
      }[];
      creation_time: string;
      dedup_key: string;
      description: string;
      details: {
        Application: string;
        CompanyId: number;
        Computer: string;
        Description: string;
        "Ip Address": string;
        "Log Text": string;
        Subsystem: string;
        Timestamp: string;
        alert_unique_identifier: string;
        edit_alert_url: string;
        related_logs_url: string;
      };
      event_class: null;
      message: string;
      mutations: [];
      priority: null;
      reporter_component: null;
      reporter_location: null;
      service_group: string;
      severity: string;
      source_component: string;
      source_location: null;
      source_origin: string;
      urgency: null;
      version: string;
    };
    summary: string;
    client_url: string;
    client: string;
  };
  service: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  };
  incident: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  };
  teams: [];
  contexts: {
    type: string;
    src: string;
    href: string;
    alt: string;
  }[];
  event_details: {
    description: string;
  };
}

export interface PagerDutyIncident {
  incident_number: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: string;
  incident_key: null;
  service: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  };
  assignments: [];
  assigned_via: string;
  last_status_change_at: string;
  resolved_at: string;
  first_trigger_log_entry: PagerDutyLogEntry;
  alert_counts: {
    all: number;
    triggered: number;
    resolved: number;
  };
  is_mergeable: boolean;
  escalation_policy: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  };
  teams: [];
  impacted_services: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  }[];
  pending_actions: [];
  acknowledgements: [];
  basic_alert_grouping: null;
  alert_grouping: null;
  last_status_change_by: {
    id: string;
    type: string;
    summary: string;
    self: string;
    html_url: string;
  };
  priority: null;
  resolve_reason: null;
  urgency: string;
  id: string;
  type: string;
  summary: string;
  self: string;
  html_url: string;
}

export interface PagerDutyGetUsersResponse {
  users: PagerDutyUser[];
}

export interface PagerDutyGetLogEntryResponse {
  log_entry: PagerDutyLogEntry;
}

export interface PagerDutyGetIncidentResponse {
  incident: PagerDutyIncident;
}
