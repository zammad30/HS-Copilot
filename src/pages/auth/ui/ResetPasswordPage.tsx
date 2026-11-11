import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";

export function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthForm mode="reset" />
    </AuthShell>
  );
}
