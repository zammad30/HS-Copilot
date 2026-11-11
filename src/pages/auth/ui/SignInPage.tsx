import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";
import { RedirectIfSignedIn } from "./RedirectIfSignedIn";

export function SignInPage() {
  return (
    <RedirectIfSignedIn>
      <AuthShell>
        <AuthForm mode="sign-in" />
      </AuthShell>
    </RedirectIfSignedIn>
  );
}
