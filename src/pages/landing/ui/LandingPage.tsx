import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Plus } from "lucide-react";
import clsx from "clsx";
import { PublicHeader, PublicFooter, MobileMenu } from "@/widgets/public-shell";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { Card } from "@/shared/ui/Card";
import { TextInput } from "@/shared/ui/TextInput";
import { Button } from "@/shared/ui/Button";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { evaluationSummary } from "@/entities/evaluation";
import { DESCRIPTION_MAX_LENGTH } from "@/entities/classification";
import { pendingDescriptionDraft } from "@/entities/session";
import styles from "./LandingPage.module.scss";

const TRY_TEXT_MAX_LENGTH = 200;

const STEPS = [
  {
    number: "01",
    title: "Describe",
    body: "Add the product, material, intended use, and origin when known.",
  },
  {
    number: "02",
    title: "Research",
    body: "The agent compares tariff text, rules, and relevant past rulings.",
  },
  {
    number: "03",
    title: "Review",
    body: "Approve, override, or ask for more information before finalizing.",
  },
] as const;

const FAQS = [
  {
    question: "Is a suggested code final?",
    answer: "No. Every output remains a suggestion until a designated reviewer approves it.",
  },
  {
    question: "Does this replace a customs broker?",
    answer:
      "No. HS Copilot organizes research and evidence; your qualified team owns the decision.",
  },
  {
    question: "Which jurisdictions are supported?",
    answer:
      "The demo uses the US HTS. Additional national tariff schedules can be configured by workspace.",
  },
] as const;

export function LandingPage() {
  useDocumentTitle("HS Copilot | Classify products with evidence");
  const navigate = useNavigate();
  const [tryText, setTryText] = useState("Men's 100% cotton knitted crew-neck T-shirt");
  const [tryError, setTryError] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const tryInputId = useId();
  const tryErrorId = useId();

  function handleTrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = tryText.trim();

    if (!trimmed) {
      setTryError("Enter a product description.");
      return;
    }

    setTryError(undefined);
    // The text goes through sessionStorage, never the URL. A failed save is swallowed
    // by the helper, so the visitor still reaches /try (which then shows its no-draft note).
    pendingDescriptionDraft.save(trimmed.slice(0, TRY_TEXT_MAX_LENGTH), DESCRIPTION_MAX_LENGTH);
    navigate(routes.try);
  }

  function goHome() {
    navigate(routes.landing);
  }

  function goToApp() {
    navigate(routes.home);
  }

  function closeMenu() {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
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

      <main>
        <section className={styles.hero}>
          <Eyebrow className={styles.heroEyebrow}>Human-reviewed tariff classification</Eyebrow>
          <h1 className={clsx(styles.heroTitle, "text-display")}>
            Classify with evidence.
            <br />
            Decide with confidence.
          </h1>
          <p className={styles.heroCopy}>
            HS Copilot researches tariff codes, explains its reasoning, and keeps a human reviewer
            in control of every final decision.
          </p>

          <Card className={styles.tryBox}>
            <form onSubmit={handleTrySubmit}>
              <label htmlFor={tryInputId} className={styles.tryBoxLabel}>
                Try one product
              </label>
              <div className={styles.tryBoxRow}>
                <TextInput
                  id={tryInputId}
                  value={tryText}
                  onChange={(event) => setTryText(event.target.value)}
                  aria-invalid={tryError ? "true" : undefined}
                  aria-describedby={tryError ? tryErrorId : undefined}
                />
                <Button type="submit" icon={<ArrowRight size={16} aria-hidden="true" />}>
                  Classify
                </Button>
              </div>
              {tryError && (
                <p id={tryErrorId} className={styles.tryBoxError}>
                  {tryError}
                </p>
              )}
              <p className={styles.tryBoxHelp}>
                No account required. Results are suggestions, not legal advice.
              </p>
            </form>
          </Card>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <Eyebrow>How it works</Eyebrow>
            <h2>From product detail to a reviewable decision</h2>
          </div>
          <div className={styles.steps}>
            {STEPS.map((step) => (
              <div className={styles.step} key={step.number}>
                <span className={styles.stepNumber}>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.accuracy}>
          <div className={styles.accuracyInner}>
            <div className={styles.sectionHeading}>
              <Eyebrow>Measured, not assumed</Eyebrow>
              <h2>Accuracy you can inspect</h2>
              <p>
                Evaluated against a held-out set of reviewed classifications across 47 chapters.{" "}
                <SampleLabel />
              </p>
              <Link className={styles.textLink} to={routes.methodology}>
                Read our methodology <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.statsWrap}>
              <div className={styles.statListHeader}>
                <SampleLabel />
              </div>
              <dl className={styles.statList}>
                <div className={styles.statRow}>
                  <dt>Top-3 code recall</dt>
                  <dd>{evaluationSummary.top3Recall}%</dd>
                </div>
                <div className={styles.statRow}>
                  <dt>Top-1 exact match</dt>
                  <dd>{evaluationSummary.top1ExactMatch}%</dd>
                </div>
                <div className={styles.statRow}>
                  <dt>Reviewed test cases</dt>
                  <dd>{evaluationSummary.reviewedTestCases.toLocaleString("en-US")}</dd>
                </div>
                <div className={styles.statRow}>
                  <dt>Human-controlled finals</dt>
                  <dd>{evaluationSummary.humanControlledRate}%</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.faq}>
            <div className={styles.sectionHeading}>
              <Eyebrow>Important context</Eyebrow>
              <h2>Designed to support professional judgment</h2>
            </div>
            <div className={styles.faqList}>
              {FAQS.map((item) => (
                <details className={styles.faqItem} key={item.question}>
                  <summary className={styles.faqSummary}>
                    {item.question}
                    <Plus size={16} aria-hidden="true" />
                  </summary>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter onLogoClick={goHome} />
    </div>
  );
}
