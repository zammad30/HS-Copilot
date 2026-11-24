import { Link } from "react-router";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { StatusScreen } from "./StatusScreen";
import styles from "./RouteErrorScreen.module.scss";

// Unknown /app/* URL, rendered inside the app shell. The public 404 page keeps its own chrome.
export function AppNotFoundScreen() {
  useDocumentTitle("Page not found | HS Copilot");

  return (
    <StatusScreen
      title="Page not found"
      description="The link may be outdated or the page may have moved."
      shouldFocusHeading
    >
      <Link className={styles.homeLink} to={routes.home}>
        Back to home
      </Link>
    </StatusScreen>
  );
}
