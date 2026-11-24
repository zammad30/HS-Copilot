import { Link } from "react-router";
import { Button } from "@/shared/ui/Button";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { StatusScreen } from "./StatusScreen";
import styles from "./RouteErrorScreen.module.scss";

export interface RouteErrorScreenProps {
  homePath: string;
  isFullPage?: boolean;
}

// Deliberately takes no error prop: the raw message and stack never reach the user.
export function RouteErrorScreen({ homePath, isFullPage = false }: RouteErrorScreenProps) {
  useDocumentTitle("Something went wrong | HS Copilot");

  return (
    <StatusScreen
      title="Something went wrong"
      description="Reload the page or go back. If this keeps happening, contact support."
      isFullPage={isFullPage}
      shouldFocusHeading
    >
      <div className={styles.actions}>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
        <Link className={styles.homeLink} to={homePath}>
          Go to home
        </Link>
      </div>
    </StatusScreen>
  );
}
