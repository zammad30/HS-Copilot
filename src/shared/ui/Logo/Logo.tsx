import styles from "./Logo.module.scss";

export interface LogoProps {
  onClick: () => void;
}

export function Logo({ onClick }: LogoProps) {
  return (
    <button type="button" className={styles.logo} onClick={onClick} aria-label="HS Copilot home">
      <span className={styles.mark}>HS</span> Copilot
    </button>
  );
}
