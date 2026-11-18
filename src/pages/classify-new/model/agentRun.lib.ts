import type { AgentRun } from "./agentRun.schema";

export function isRunComplete(run: AgentRun): boolean {
  return run.steps.every((step) => step.state === "done");
}

export function needsAnswer(run: AgentRun): boolean {
  return run.question !== undefined;
}
