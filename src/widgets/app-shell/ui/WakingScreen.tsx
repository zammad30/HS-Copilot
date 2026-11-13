import styles from "./WakingScreen.module.scss";

export function WakingScreen() {
  return (
    <div className={styles.flowState}>
      <h1>Server waking up</h1>
      <p>Preparing your workspace. This usually takes less than a minute.</p>
      <div className={styles.progressIndeterminate}>
        <span />
      </div>
    </div>
  );
}
