import { Check, Circle } from "lucide-react";
import clsx from "clsx";
import type { AgentRunStep } from "../model/agentRun.schema";
import styles from "./AgentSteps.module.scss";

export interface AgentStepsProps {
  steps: AgentRunStep[];
}

export function AgentSteps({ steps }: AgentStepsProps) {
  const activeStep = steps.find((step) => step.state === "active" || step.state === "paused");

  return (
    <>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.id} className={clsx(styles.step, styles[step.state])}>
            <span className={styles.icon} aria-hidden="true">
              {step.state === "done" ? <Check size={16} /> : <Circle size={16} />}
            </span>
            <div className={styles.text}>
              <p className={styles.title}>{step.title}</p>
              <p className={styles.detail}>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p aria-live="polite" className={styles.liveRegion}>
        {activeStep ? activeStep.title : ""}
      </p>
    </>
  );
}
