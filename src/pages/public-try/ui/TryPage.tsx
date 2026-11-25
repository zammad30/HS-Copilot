import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import clsx from "clsx";
import { PublicHeader, PublicFooter, MobileMenu } from "@/widgets/public-shell";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Meter } from "@/shared/ui/Meter";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { safeReturnPath } from "@/shared/lib/safeReturnPath";
import { CodeText, DESCRIPTION_MAX_LENGTH } from "@/entities/classification";
import { pendingDescriptionDraft, useSession } from "@/entities/session";
import { sampleResult } from "../model/sampleResult.constants";
import styles from "./TryPage.module.scss";

// Only the safe in-app path travels in the link. The typed text stays in sessionStorage.
const NEXT_SEARCH = `?next=${encodeURIComponent(safeReturnPath(routes.classifyNew))}`;

export function TryPage() {
  useDocumentTitle("Sample result | HS Copilot");
  const navigate = useNavigate();
  const session = useSession();
  // Read once and never cleared here: Classify new clears it when it uses the text.
  const [draft] = useState(() => pendingDescriptionDraft.read(DESCRIPTION_MAX_LENGTH));
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

      <main id="main-content" className={styles.article}>
        <PageHeader
          className={styles.pageHeader}
          eyebrow="Sample result"
          title="See how a result looks"
          description="This is an example for a different product, not an answer for your text. Create an account to classify your own."
        />

        <section className={styles.block} aria-labelledby="try-description-heading">
          <h2 id="try-description-heading">Your description</h2>
          <Card className={styles.descriptionCard}>
            {draft ? (
              <p className={styles.draftText}>{draft}</p>
            ) : (
              <p className={styles.note}>
                Describe a product to see it here.{" "}
                <Link className={styles.textLink} to={routes.landing}>
                  Back to home
                </Link>
              </p>
            )}
          </Card>
        </section>

        <section className={styles.block} aria-labelledby="try-sample-heading">
          <div className={styles.headingRow}>
            <h2 id="try-sample-heading">Sample result</h2>
            <SampleLabel />
          </div>

          <Card className={styles.resultCard}>
            <p className={styles.caption}>Recommended code</p>
            <div className={styles.codeRow}>
              <CodeText size="hero">{sampleResult.code}</CodeText>
              <Meter value={sampleResult.confidence} aria-label="Overall confidence" />
            </div>
            <h3>{sampleResult.product}</h3>
            <p className={styles.reasoning}>{sampleResult.reasoning}</p>
            <ul className={styles.basisList} aria-label="Basis">
              {sampleResult.basis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <h3 className={styles.subheading}>Top suggestions</h3>
          <ol className={styles.candidates}>
            {sampleResult.candidates.map((candidate) => (
              <li key={candidate.code} className={styles.candidate}>
                <CodeText>{candidate.code}</CodeText>
                <span className={styles.candidateTitle}>{candidate.title}</span>
                <Meter value={candidate.confidence} aria-label={`Confidence ${candidate.code}`} />
              </li>
            ))}
          </ol>

          <div className={styles.evidence}>
            <Card className={styles.evidenceCard}>
              <p className={styles.caption}>Tariff text</p>
              <CodeText>{sampleResult.tariffText.reference}</CodeText>
              <blockquote className={styles.quote}>{sampleResult.tariffText.excerpt}</blockquote>
            </Card>
            <Card className={styles.evidenceCard}>
              <p className={styles.caption}>Similar past ruling</p>
              <p className={styles.rulingRef}>
                <CodeText>{sampleResult.ruling.reference}</CodeText> <SampleLabel />
              </p>
              <p>{sampleResult.ruling.summary}</p>
            </Card>
          </div>
        </section>

        <section className={styles.actions} aria-label="Next step">
          {session ? (
            <Link className={clsx(styles.cta, styles.ctaPrimary)} to={routes.classifyNew}>
              Continue in Classify new
            </Link>
          ) : (
            <>
              <Link
                className={clsx(styles.cta, styles.ctaPrimary)}
                to={{ pathname: routes.signUp, search: NEXT_SEARCH }}
              >
                Create account
              </Link>
              <Link
                className={clsx(styles.cta, styles.ctaSecondary)}
                to={{ pathname: routes.signIn, search: NEXT_SEARCH }}
              >
                Sign in
              </Link>
            </>
          )}
        </section>

        <p className={styles.disclaimer}>
          This is a classification suggestion to support your decision. Confirm it with a licensed
          customs broker or your customs authority before you file.
        </p>
      </main>

      <PublicFooter onLogoClick={goHome} />
    </div>
  );
}
