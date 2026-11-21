import { useId } from "react";
import { Card } from "@/shared/ui/Card";
import { FormField } from "@/shared/ui/FormField";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";
import { usePlans, useWorkspace } from "@/entities/workspace";
import type { PlanId } from "@/entities/workspace";
import { useSwitchDemoPlan } from "../api/demoPlan.mutation";
import styles from "./DemoPlanCard.module.scss";

// Rendered by the page only in mock mode (env.useMocks); the real API has no plan switch.
export function DemoPlanCard() {
  const workspace = useWorkspace();
  const plans = usePlans();
  const switchPlan = useSwitchDemoPlan();
  const { show } = useToast();
  const helpId = useId();

  if (!workspace.data || !plans.data) return null;
  const items = plans.data.items;

  function handleChange(planId: PlanId) {
    const name = items.find((item) => item.id === planId)?.name ?? planId;
    switchPlan.mutate(planId, {
      onSuccess: () => show(`Demo plan changed to ${name}.`, { tone: "success" }),
      // Toast has no error tone, so the info tone carries the error text.
      onError: () => show("We couldn't change the demo plan. Try again.", { tone: "info" }),
    });
  }

  return (
    <Card className={styles.card}>
      <h2>Demo plan</h2>
      <FormField label="Demo plan">
        <Select
          value={workspace.data.plan}
          onChange={(event) => handleChange(event.target.value as PlanId)}
          disabled={switchPlan.isPending}
          aria-describedby={helpId}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </FormField>
      <p id={helpId} className={styles.helper}>
        Mock mode only. Switches the sample plan so you can try limits and expiry.
      </p>
    </Card>
  );
}
