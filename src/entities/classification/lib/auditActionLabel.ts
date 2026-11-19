const LABELS: Record<string, string> = {
  created: "Classification started",
  details_confirmed: "Product details confirmed",
  research_completed: "Research completed",
  approved: "Classification approved",
  overridden: "Code overridden",
  rejected: "Classification rejected",
  info_requested: "More information requested",
  undone: "Decision undone",
};

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action;
}
