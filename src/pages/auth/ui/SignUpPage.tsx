import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";
import { RedirectIfSignedIn } from "./RedirectIfSignedIn";

export function SignUpPage() {
  return (
    <RedirectIfSignedIn>
      <AuthShell>
        <AuthForm mode="sign-up" />
      </AuthShell>
    </RedirectIfSignedIn>
  );
}
