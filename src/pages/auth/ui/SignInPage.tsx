import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";
import { RedirectIfSignedIn } from "./RedirectIfSignedIn";

export function SignInPage() {
  useDocumentTitle("Sign in | HS Copilot");

  return (
    <RedirectIfSignedIn>
      <AuthShell>
        <AuthForm mode="sign-in" />
      </AuthShell>
    </RedirectIfSignedIn>
  );
}
