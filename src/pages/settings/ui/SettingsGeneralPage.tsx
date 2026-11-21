import { useId, useState } from "react";
import { Card } from "@/shared/ui/Card";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ErrorState } from "@/shared/ui/ErrorState";
import { useToast } from "@/shared/ui/Toast";
import { useSession, useSetSession, useSignOut } from "@/entities/session";
import { DESTINATIONS } from "@/entities/classification";
import type { Jurisdiction } from "@/entities/classification";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { useWorkspace } from "@/entities/workspace";
import type { Workspace } from "@/entities/workspace";
import { useUpdateWorkspaceSettings } from "../api/workspaceSettings.mutation";
import { useUpdateAccount } from "../api/account.mutation";
import styles from "./SettingsGeneralPage.module.scss";

export function SettingsGeneralPage() {
  useDocumentTitle("Settings · General");
  const session = useSession();
  const setSession = useSetSession();
  const signOut = useSignOut();
  const { show } = useToast();
  const destinationHelpId = useId();

  const { data, isPending, isError, refetch } = useWorkspace();
  const updateWorkspace = useUpdateWorkspaceSettings();
  const updateAccount = useUpdateAccount();

  const [baseline, setBaseline] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("US_HTS");

  // Re-baseline the form when fresh data arrives: the first load, or after a
  // save re-fetches. Adjusted during render, not an effect - a pure derivation.
  if (data && data !== baseline) {
    setBaseline(data);
    setWorkspaceName(data.name);
    setJurisdiction(data.defaultJurisdiction);
  }

  const [accountBaseline, setAccountBaseline] = useState(session?.name ?? "");
  const [displayName, setDisplayName] = useState(session?.name ?? "");
  if ((session?.name ?? "") !== accountBaseline && displayName === accountBaseline) {
    setAccountBaseline(session?.name ?? "");
    setDisplayName(session?.name ?? "");
  }

  const workspaceDirty = Boolean(
    baseline && (workspaceName !== baseline.name || jurisdiction !== baseline.defaultJurisdiction),
  );
  const accountDirty = displayName.trim() !== accountBaseline && displayName.trim() !== "";

  function handleSaveWorkspace() {
    updateWorkspace.mutate(
      { name: workspaceName, defaultJurisdiction: jurisdiction },
      {
        onSuccess: (updated) => {
          if (session) setSession({ ...session, workspaceName: updated.name });
          show("Settings saved", { tone: "success" });
        },
      },
    );
  }

  function handleSaveAccount() {
    updateAccount.mutate(
      { name: displayName.trim() },
      {
        onSuccess: (updated) => {
          if (session) setSession({ ...session, name: updated.name });
          setAccountBaseline(updated.name);
          show("Settings saved", { tone: "success" });
        },
      },
    );
  }

  return (
    <>
      <Card className={styles.card}>
        <h2>Workspace defaults</h2>
        <p className={styles.description}>
          Applied automatically to new classifications and batches.
        </p>

        {isError ? (
          <ErrorState title="We couldn't load settings" onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton lines={3} />
        ) : (
          <>
            <FormField label="Workspace name">
              <TextInput
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                disabled={updateWorkspace.isPending}
              />
            </FormField>
            <FormField label="Default destination">
              <Select
                value={jurisdiction}
                onChange={(event) => setJurisdiction(event.target.value as Jurisdiction)}
                disabled={updateWorkspace.isPending}
                aria-describedby={destinationHelpId}
              >
                {DESTINATIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <p id={destinationHelpId} className={styles.helper}>
              Used as the starting value for new classifications. You can change it for each one.
            </p>
            <div className={styles.actions}>
              <Button
                onClick={handleSaveWorkspace}
                disabled={!workspaceDirty || updateWorkspace.isPending}
                isLoading={updateWorkspace.isPending}
              >
                Save changes
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card className={styles.card}>
        <h2>Account</h2>
        <FormField label="Display name">
          <TextInput
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={updateAccount.isPending}
          />
        </FormField>
        <FormField label="Email">
          <TextInput value={session?.email ?? ""} disabled readOnly />
        </FormField>
        <div className={styles.actions}>
          <Button
            onClick={handleSaveAccount}
            disabled={!accountDirty || updateAccount.isPending}
            isLoading={updateAccount.isPending}
          >
            Save changes
          </Button>
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Card>
    </>
  );
}
