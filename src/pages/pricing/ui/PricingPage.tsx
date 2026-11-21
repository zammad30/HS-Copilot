import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Check, Minus } from "lucide-react";
import clsx from "clsx";
import { PublicHeader, PublicFooter, MobileMenu } from "@/widgets/public-shell";
import { usePlans, useWorkspace } from "@/entities/workspace";
import type { Plan, PlanId } from "@/entities/workspace";
import { useSession } from "@/entities/session";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ErrorState } from "@/shared/ui/ErrorState";
import { useToast } from "@/shared/ui/Toast";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import {
  formatBatchFeature,
  formatClassificationsFeature,
  formatPeopleFeature,
  formatPrice,
  formatRetentionFeature,
  hasBatchAccess,
} from "../lib/formatPlan";
import styles from "./PricingPage.module.scss";

interface Feature {
  key: string;
  text: string;
  isIncluded: boolean;
}

// Same keys in the same order for every plan so the cards line up. API access is
// static copy, never data: the real backend has no such field (docs/api-contract.md, Plans).
function getFeatures(plan: Plan): Feature[] {
  const { limits } = plan;
  return [
    {
      key: "classifications",
      text: formatClassificationsFeature(limits.classifications),
      isIncluded: true,
    },
    { key: "people", text: formatPeopleFeature(limits.seats), isIncluded: true },
    {
      key: "batch",
      text: formatBatchFeature(limits.batch),
      isIncluded: hasBatchAccess(limits.batch),
    },
    { key: "secondApprover", text: "Second approver", isIncluded: limits.secondApprover },
    {
      key: "retention",
      text: formatRetentionFeature(limits.auditRetentionDays),
      isIncluded: true,
    },
    { key: "api", text: "API access (planned)", isIncluded: false },
  ];
}

const TAGLINES: Record<PlanId, string> = {
  free: "To try the product",
  solo: "For one reviewer",
  team: "For a small team",
};

const NOTES = [
  "Batch rows count against your monthly classification limit. A batch that would go over the remaining limit is refused before it starts.",
  "Records and their audit trail are deleted after the retention period, so save what you need to keep before then.",
  "Everyone who uses the product needs an account.",
];

const SKELETON_CARDS = ["a", "b", "c"];

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  action: ReactNode;
}

function PlanCard({ plan, isCurrent, action }: PlanCardProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.cell}>
      <Card variant={isCurrent ? "selected" : "default"} className={styles.card}>
        <div className={styles.heading}>
          <h2 id={headingId} className={styles.planName}>
            {plan.name}
          </h2>
          <p className={styles.tagline}>{TAGLINES[plan.id]}</p>
          <p className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(plan.priceMonthlyCents)}</span>
            <span className={styles.period}>per month</span>
          </p>
        </div>
        <hr className={styles.divider} />
        <ul className={styles.features}>
          {getFeatures(plan).map((feature) => (
            <li
              key={feature.key}
              className={clsx(styles.feature, !feature.isIncluded && styles.notIncluded)}
            >
              {feature.isIncluded ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Minus size={16} aria-hidden="true" />
              )}
              <span className={styles.visuallyHidden}>
                {feature.isIncluded ? "Included:" : "Not included:"}
              </span>
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        <div className={styles.action}>{action}</div>
      </Card>
    </section>
  );
}

export function PricingPage() {
  useDocumentTitle("Pricing | HS Copilot");
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const session = useSession();
  const isSignedIn = session !== null;
  const { data, isPending, isError, refetch } = usePlans();
  // Signed-out visitors never trigger GET /workspace.
  const workspace = useWorkspace({ enabled: isSignedIn });
  const currentPlanId: PlanId | undefined = isSignedIn ? workspace.data?.plan : undefined;
  const hasWorkspaceError = isSignedIn && workspace.isError;

  const currentPlanPrice = data?.items.find((p) => p.id === currentPlanId)?.priceMonthlyCents;

  function showUnavailableToast() {
    toast.show("Plan changes are not available in this demo.", { tone: "info" });
  }

  function goHome() {
    navigate(routes.landing);
  }

  function goToApp() {
    navigate(routes.home);
  }

  function goToSignUp() {
    navigate(routes.signUp);
  }

  function closeMenu() {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }

  function renderAction(plan: Plan): ReactNode {
    if (!isSignedIn) {
      return <Button onClick={goToSignUp}>Get started</Button>;
    }
    if (workspace.isLoading) {
      return <Skeleton lines={1} aria-hidden="true" />;
    }
    if (hasWorkspaceError) return null;
    if (plan.id === currentPlanId) {
      return <div className={styles.currentPlan}>Current plan</div>;
    }
    const isUpgrade = currentPlanPrice !== undefined && plan.priceMonthlyCents > currentPlanPrice;
    return (
      <Button onClick={showUnavailableToast}>
        {isUpgrade ? "Upgrade plan" : "Downgrade plan"}
      </Button>
    );
  }

  return (
    <div className={styles.page}>
      <PublicHeader
        onLogoClick={goHome}
        onOpenDemo={goToApp}
        onOpenMenu={() => setMenuOpen(true)}
        hamburgerRef={hamburgerRef}
      />
      {menuOpen && <MobileMenu onClose={closeMenu} onLogoClick={goHome} onOpenDemo={goToApp} />}

      <main className={styles.main}>
        <header className={styles.header}>
          <Eyebrow>Pricing</Eyebrow>
          <h1>Plans and limits</h1>
          <p className={styles.description}>
            Compare what each plan includes. The figures below are sample data while the product is
            in development.
          </p>
          {hasWorkspaceError && (
            <p className={styles.workspaceError}>We could not load your current plan.</p>
          )}
        </header>

        {isError ? (
          <div className={styles.errorWrap}>
            <ErrorState title="We couldn't load plans" onRetry={() => refetch()} />
          </div>
        ) : isPending ? (
          <div className={styles.grid} aria-busy="true" aria-label="Loading plans" role="group">
            {SKELETON_CARDS.map((id) => (
              <Card key={id} className={styles.card}>
                <Skeleton lines={9} />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {data.items.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={plan.id === currentPlanId}
                  action={renderAction(plan)}
                />
              ))}
            </div>
            <div className={styles.footnotes}>
              <SampleLabel />
              <p className={styles.demoLine}>This is a demo. No payments are taken.</p>
              <div className={styles.notes}>
                {NOTES.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <PublicFooter onLogoClick={goHome} />
    </div>
  );
}
