import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";

export function ResetPasswordPage() {
  useDocumentTitle("Reset password | HS Copilot");

  return (
    <AuthShell>
      <AuthForm mode="reset" />
    </AuthShell>
  );
}
