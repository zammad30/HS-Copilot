import { StaticPage } from "./StaticPage";

export function PrivacyPage() {
  return (
    <StaticPage title="Privacy">
      <p>
        We use workspace data only to provide classification research, review, and audit features.
        Access is limited to authorized workspace members.
      </p>
      <h2>Product data</h2>
      <p>
        Uploaded product descriptions and supporting records remain within the workspace and can be
        exported or deleted by administrators.
      </p>
    </StaticPage>
  );
}
