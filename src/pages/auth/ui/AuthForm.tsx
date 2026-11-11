import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { Button } from "@/shared/ui/Button";
import { Banner } from "@/shared/ui/Banner";
import { routes } from "@/shared/config";
import { useSetSession } from "@/entities/session";
import { fieldErrorsFrom, resetSchema, signInSchema, signUpSchema } from "../model/auth.schema";
import { useSignIn } from "../api/signIn.mutation";
import { useSignUp } from "../api/signUp.mutation";
import { useResetPassword } from "../api/resetPassword.mutation";
import styles from "./AuthForm.module.scss";

export type AuthMode = "sign-in" | "sign-up" | "reset";

export interface AuthFormProps {
  mode: AuthMode;
}

const COPY: Record<
  AuthMode,
  { eyebrow: string; title: string; description: string; submitLabel: string }
> = {
  "sign-in": {
    eyebrow: "Welcome back",
    title: "Sign in to HS Copilot",
    description: "Continue to your classifications and reviews.",
    submitLabel: "Sign in",
  },
  "sign-up": {
    eyebrow: "Create account",
    title: "Start your workspace",
    description: "Set up a review-ready classification workspace.",
    submitLabel: "Create account",
  },
  reset: {
    eyebrow: "Reset password",
    title: "Reset your password",
    description: "We'll send a reset link to your work email.",
    submitLabel: "Send reset link",
  },
};

const BANNER_COPY: Record<AuthMode, string> = {
  "sign-in": "We couldn't sign you in. Check your email and password and try again.",
  "sign-up": "We couldn't create your account. Check your details and try again.",
  reset: "We couldn't send the reset link. Try again.",
};

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const setSession = useSetSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bannerError, setBannerError] = useState<string | undefined>(undefined);
  const [resetSent, setResetSent] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const signIn = useSignIn();
  const signUp = useSignUp();
  const resetPassword = useResetPassword();

  const pending = signIn.isPending || signUp.isPending || resetPassword.isPending;
  const copy = COPY[mode];

  function focusFirstInvalid(fieldErrors: Record<string, string>) {
    if (fieldErrors.name) nameRef.current?.focus();
    else if (fieldErrors.email) emailRef.current?.focus();
    else if (fieldErrors.password) passwordRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBannerError(undefined);

    if (mode === "sign-up") {
      const result = signUpSchema.safeParse({ name, email, password });
      const fieldErrors = fieldErrorsFrom(result);
      setErrors(fieldErrors);
      if (!result.success) {
        focusFirstInvalid(fieldErrors);
        return;
      }
      signUp.mutate(result.data, {
        onSuccess: (session) => {
          setSession(session);
          navigate(routes.home);
        },
        onError: () => {
          setBannerError(BANNER_COPY["sign-up"]);
          setPassword("");
        },
      });
      return;
    }

    if (mode === "sign-in") {
      const result = signInSchema.safeParse({ email, password });
      const fieldErrors = fieldErrorsFrom(result);
      setErrors(fieldErrors);
      if (!result.success) {
        focusFirstInvalid(fieldErrors);
        return;
      }
      signIn.mutate(result.data, {
        onSuccess: (session) => {
          setSession(session);
          navigate(routes.home);
        },
        onError: () => {
          setBannerError(BANNER_COPY["sign-in"]);
          setPassword("");
        },
      });
      return;
    }

    const result = resetSchema.safeParse({ email });
    const fieldErrors = fieldErrorsFrom(result);
    setErrors(fieldErrors);
    if (!result.success) {
      focusFirstInvalid(fieldErrors);
      return;
    }
    resetPassword.mutate(result.data, {
      onSuccess: () => setResetSent(true),
      onError: () => setBannerError(BANNER_COPY.reset),
    });
  }

  if (mode === "reset" && resetSent) {
    return (
      <>
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <h1>{copy.title}</h1>
        <p>If that email matches a workspace, we&rsquo;ve sent a reset link.</p>
        <Link className={styles.backLink} to={routes.signIn}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <h1>{copy.title}</h1>
      <p>{copy.description}</p>

      {bannerError && <Banner className={styles.banner}>{bannerError}</Banner>}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {mode === "sign-up" && (
          <FormField label="Full name" error={errors.name}>
            <TextInput
              ref={nameRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex Morgan"
              autoComplete="name"
              disabled={pending}
            />
          </FormField>
        )}

        <FormField label="Work email" error={errors.email}>
          <TextInput
            ref={emailRef}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="alex@company.com"
            autoComplete="email"
            disabled={pending}
          />
        </FormField>

        {mode !== "reset" && (
          <FormField label="Password" error={errors.password}>
            <TextInput
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              disabled={pending}
            />
          </FormField>
        )}

        {mode === "sign-in" && (
          <Link className={styles.forgotLink} to={routes.resetPassword}>
            Forgot password?
          </Link>
        )}

        <Button type="submit" isLoading={pending} disabled={pending}>
          {copy.submitLabel}
        </Button>
      </form>

      {mode === "sign-in" && (
        <div className={styles.switchLine}>
          <span>New to HS Copilot?</span>
          <Link to={routes.signUp}>Create account</Link>
        </div>
      )}
      {mode === "sign-up" && (
        <div className={styles.switchLine}>
          <span>Already have an account?</span>
          <Link to={routes.signIn}>Sign in</Link>
        </div>
      )}
      {mode === "reset" && (
        <Link className={styles.backLink} to={routes.signIn}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
        </Link>
      )}

      {mode !== "reset" && (
        <Link className={styles.demoLink} to={routes.home}>
          Try demo workspace <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </>
  );
}
