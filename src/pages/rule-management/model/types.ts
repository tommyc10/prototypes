/* The shape of the data. Everything the page shows is one of these, formatted. */

export type RuleStatus = 'active' | 'inactive' | 'proposed';
export type RuleSource = 'pattern-miner' | 'correlation-engine' | 'duplicate-detector' | 'operator';
export type Resolution = 'auto-cleared' | 'closed-no-action' | 'duplicate' | 'worked' | 'escalated';
export type AuditAction = 'proposed' | 'approved' | 'rejected' | 'activated' | 'deactivated';

export interface AssignmentGroup {
  id: string;
  name: string;
  unit: string;
  serviceGroupId: string;
}

/** A family of related services. Each assignment group works for one. */
export interface ServiceGroup {
  id: string;
  name: string;
}

export interface RelatedIncident {
  id: string;
  title: string;
  ci: string;
  openedAt: string;
  resolution: Resolution;
  minutesOpen: number;
}

export interface Condition {
  field: string;
  op: string;
  value: string;
}

/** A rule's condition, next to the value this incident actually had. */
export interface MatchedCondition extends Condition {
  actual: string;
}

/** One step in an incident's life, for its timeline. */
export interface IncidentEvent {
  at: string;
  actor: string;
  text: string;
}

/** Everything about one incident beyond its row in the list. Loaded when it's opened. */
export interface IncidentDetail {
  /** 1 (highest) to 4, as it stood when the incident closed. */
  priority: number;
  /** How many alerts were folded into this one incident. */
  alertCount: number;
  handledBy: string;
  closeNote: string;
  matched: MatchedCondition[];
  /** Oldest first. */
  events: IncidentEvent[];
}

export interface Evidence {
  summary: string;
  conditions: Condition[];
  window: string;
  weekly: number[];
  medianClear: string;
  recurrence: string;
  escalations: number;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: AuditAction;
  reason: string;
  override?: boolean;
}

export interface Rule {
  id: string;
  name: string;
  status: RuleStatus;
  groupId: string;
  confidence: number;
  purity: number;
  incidentCount: number;
  source: RuleSource;
  sourceDetail: string;
  createdAt: string;
  updatedAt: string;
  evidence: Evidence;
  related: RelatedIncident[];
  audit: AuditEntry[];
}

/** What a person can do to a rule. Which ones are allowed depends on its status (see policy.ts). */
export type RuleAction = 'approve' | 'reject' | 'activate' | 'deactivate';

/** What a rule hides, or would hide, over its evidence window. */
export interface Impact {
  suppressed: number;
  escalated: number;
  hoursSaved: number;
}
