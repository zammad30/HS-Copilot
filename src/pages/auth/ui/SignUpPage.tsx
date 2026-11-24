import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";
import { RedirectIfSignedIn } from "./RedirectIfSignedIn";

export function SignUpPage() {
  useDocumentTitle("Create account | HS Copilot");

  return (
    <RedirectIfSignedIn>
      <AuthShell>
        <AuthForm mode="sign-up" />
      </AuthShell>
    </RedirectIfSignedIn>
  );
}
