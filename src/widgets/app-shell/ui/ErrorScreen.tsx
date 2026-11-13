import { Button } from "@/shared/ui/Button";
import styles from "./ErrorScreen.module.scss";

export interface ErrorScreenProps {
  onRetry: () => void;
}

export function ErrorScreen({ onRetry }: ErrorScreenProps) {
  return (
    <div className={styles.flowState}>
      <h1>We couldn&rsquo;t load this workspace</h1>
      <p>Your work is safe. Clear the temporary error and try loading the demo again.</p>
      <Button variant="reject" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
