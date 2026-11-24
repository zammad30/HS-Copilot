import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PublicHeader, PublicFooter, MobileMenu } from "@/widgets/public-shell";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { evaluationSummary } from "@/entities/evaluation";
import styles from "./MethodologyPage.module.scss";

const METHOD_STEPS = [
  {
    number: "01",
    title: "Extracts product facts",
    body: "Identifies composition, function, construction, and presentation from the description and attachments.",
  },
  {
    number: "02",
    title: "Builds a candidate set",
    body: "Retrieves relevant heading text, section notes, explanatory notes, and analogous rulings.",
  },
  {
    number: "03",
    title: "Applies classification rules",
    body: "Tests candidates against the General Rules of Interpretation and jurisdiction-specific guidance.",
  },
  {
    number: "04",
    title: "Surfaces uncertainty",
    body: "Returns ranked suggestions, evidence, confidence, and questions where decisive facts are missing.",
  },
] as const;

export function MethodologyPage() {
  useDocumentTitle("Methodology | HS Copilot");
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

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

      <main className={styles.article}>
        <PageHeader
          className={styles.pageHeader}
          eyebrow="Methodology & accuracy"
          title="A transparent process, built for review."
          description="We evaluate the classifier on product records it has not seen during development, and publish the limits alongside the results."
        />

        <div className={styles.methodGrid}>
          <section className={styles.prose}>
            <h2>How the agent works</h2>
            <div className={styles.steps}>
              {METHOD_STEPS.map((step) => (
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

          <section className={styles.evaluation}>
            <div className={styles.evaluationHeading}>
              <Eyebrow>Current evaluation</Eyebrow>
              <SampleLabel />
            </div>
            <p className={styles.evaluationIntro}>
              expert-reviewed records, stratified across 47 tariff chapters and withheld from prompt
              and retrieval tuning.
            </p>
            <dl className={styles.evaluationList}>
              <div>
                <dt>Reviewed records</dt>
                <dd>{evaluationSummary.reviewedTestCases.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>Snapshot</dt>
                <dd>{evaluationSummary.htsSnapshot}</dd>
              </div>
              <div>
                <dt>Top-1 exact</dt>
                <dd>{evaluationSummary.top1ExactMatch}%</dd>
              </div>
              <div>
                <dt>Top-3 recall</dt>
                <dd>{evaluationSummary.top3Recall}%</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{evaluationSummary.lastUpdatedAt}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className={styles.chartSection}>
          <div className={styles.sectionHeading}>
            <Eyebrow>By tariff chapter</Eyebrow>
            <h2>
              Top-3 recall <SampleLabel />
            </h2>
          </div>
          <div className={styles.barChart}>
            {evaluationSummary.chapterRecall.map((chapter) => (
              <div className={styles.barRow} key={chapter.code}>
                <span className={styles.barCode}>{chapter.code}</span>
                <span>{chapter.name}</span>
                <div
                  className={styles.barTrack}
                  role="img"
                  aria-label={`${chapter.name}, ${chapter.recallPercent} percent`}
                >
                  <span className={styles.barFill} style={{ width: `${chapter.recallPercent}%` }} />
                </div>
                <strong>{chapter.recallPercent}%</strong>
              </div>
            ))}
          </div>
          <p className={styles.caption}>
            Accuracy varies by product detail and chapter complexity. Confidence is calibrated
            separately and should not substitute for review.
          </p>
        </section>
      </main>

      <PublicFooter onLogoClick={goHome} />
    </div>
  );
}
