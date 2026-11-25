import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/shared/ui/Card";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { Menu } from "@/shared/ui/Menu";
import type { MenuItemConfig } from "@/shared/ui/Menu";
import { IconButton } from "@/shared/ui/IconButton";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { Select } from "@/shared/ui/Select";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Banner } from "@/shared/ui/Banner";
import { useToast } from "@/shared/ui/Toast";
import { useSession } from "@/entities/session";
import { useMembers } from "@/entities/member";
import {
  PlanLimitNotice,
  formatUsageCount,
  parsePlanLimitError,
  planLimitMessage,
  useWorkspace,
} from "@/entities/workspace";
import type { PlanLimitDetails } from "@/entities/workspace";
import type { Member, MemberRole } from "@/entities/member";
import { formatTime } from "@/shared/lib/formatDate";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { useInviteMember, useRemoveMember, useUpdateMemberRole } from "../api/members.mutation";
import styles from "./SettingsMembersPage.module.scss";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "reviewer", label: "Reviewer" },
  { value: "analyst", label: "Analyst" },
];

const ROLE_PERMISSIONS = [
  { role: "Admin", description: "Manage settings, members, and all decisions." },
  { role: "Reviewer", description: "Approve, reject, and override classifications." },
  { role: "Analyst", description: "Create and research classifications." },
] as const;

export function SettingsMembersPage() {
  useDocumentTitle("Settings · Members | HS Copilot");
  const session = useSession();
  const isAdmin = session?.role === "admin";
  const { show } = useToast();

  const { data, isPending, isError, refetch } = useMembers();
  const inviteMutation = useInviteMember();
  const roleMutation = useUpdateMemberRole();
  const removeMutation = useRemoveMember();

  const [bannerVisible, setBannerVisible] = useState(true);

  const { data: workspace } = useWorkspace();
  const seatsNoticeId = useId();
  // Set by a 403 from invite. Shown inside the modal instead of the page notice, so only
  // one notice is on screen at a time; cleared when the modal closes.
  const [inviteLimit, setInviteLimit] = useState<PlanLimitDetails | null>(null);
  const seats = workspace?.limits.seats;
  const seatsUsed = workspace?.usage.seatsUsed;
  const isSeatsFull = seats !== undefined && seatsUsed !== undefined && seatsUsed >= seats;
  const showSeatsNotice = isSeatsFull && inviteLimit === null;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("analyst");
  const [inviteError, setInviteError] = useState<string | undefined>(undefined);
  const inviteTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const removeReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const actionTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const items = data?.items ?? [];
  const adminCount = items.filter((member) => member.role === "admin").length;

  function isSelf(member: Member): boolean {
    return session?.email === member.email;
  }

  function isLastAdmin(member: Member): boolean {
    return member.role === "admin" && adminCount <= 1;
  }

  function roleDisabledReason(member: Member): string | undefined {
    if (isSelf(member)) return "You can't change your own role.";
    if (isLastAdmin(member)) return "You can't demote the last admin.";
    return undefined;
  }

  function removeDisabledReason(member: Member): string | undefined {
    if (isSelf(member)) return "You can't remove yourself.";
    if (isLastAdmin(member)) return "You can't remove the last admin.";
    return undefined;
  }

  function handleInviteOpenChange(open: boolean) {
    setInviteOpen(open);
    if (!open) {
      setInviteEmail("");
      setInviteRole("analyst");
      setInviteError(undefined);
      setInviteLimit(null);
    }
  }

  function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setInviteError("Enter a valid email address.");
      return;
    }
    setInviteError(undefined);
    setInviteLimit(null);
    inviteMutation.mutate(
      { email, role: inviteRole },
      {
        onSuccess: () => {
          handleInviteOpenChange(false);
          show("Invitation sent", { tone: "success" });
        },
        onError: (error) => {
          const details = parsePlanLimitError(error);
          if (details?.reason === "seats") {
            setInviteLimit(details);
            return;
          }
          setInviteError("We couldn't send the invitation. Try again.");
        },
      },
    );
  }

  function handleResendInvite(member: Member) {
    inviteMutation.mutate(
      { email: member.email, role: member.role },
      {
        onSuccess: () => show("Invitation sent again", { tone: "success" }),
        onError: () => show("We couldn't resend the invitation."),
      },
    );
  }

  function handleRoleChange(member: Member, role: MemberRole) {
    roleMutation.mutate(
      { id: member.id, role },
      {
        onSuccess: () => show("Role updated", { tone: "success" }),
        onError: () => show("We couldn't update the role."),
      },
    );
  }

  function handleRemoveSelected(member: Member) {
    removeReturnFocusRef.current = actionTriggerRefs.current.get(member.id) ?? null;
    setRemoveTarget(member);
  }

  function handleRemoveConfirmed() {
    if (!removeTarget) return;
    const target = removeTarget;
    setRemoveTarget(null);
    removeMutation.mutate(target.id, {
      onSuccess: () => show("Member removed", { tone: "delete" }),
      onError: () => show("We couldn't remove this member."),
    });
  }

  const columns: DataTableColumn<Member>[] = [
    { key: "name", header: "Name", render: (member) => member.name },
    { key: "email", header: "Email", render: (member) => member.email },
    {
      key: "role",
      header: "Role",
      render: (member) => (
        <Select
          value={member.role}
          onChange={(event) => handleRoleChange(member, event.target.value as MemberRole)}
          disabled={!isAdmin || Boolean(roleDisabledReason(member)) || roleMutation.isPending}
          title={roleDisabledReason(member)}
          aria-label={`Role for ${member.name}`}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: "lastActiveAt",
      header: "Last active",
      render: (member) => (member.lastActiveAt ? formatTime(member.lastActiveAt) : "-"),
    },
    {
      key: "status",
      header: "Status",
      render: (member) => (
        <span className={styles.status}>
          <span
            aria-hidden="true"
            className={clsx(styles.statusDot, member.status === "active" && styles.active)}
          />
          {member.status === "active" ? "Active" : "Invited"}
        </span>
      ),
    },
  ];

  return (
    <>
      {!isAdmin && bannerVisible && (
        <Banner onDismiss={() => setBannerVisible(false)}>Only admins can manage members.</Banner>
      )}

      <Card className={styles.card}>
        <div className={styles.cardHeading}>
          <div>
            <h2>Members</h2>
            <p className={styles.description}>
              {`People with access to ${session?.workspaceName ?? "this workspace"}.`}
            </p>
          </div>
          <div className={styles.invite}>
            <Button
              ref={inviteTriggerRef}
              icon={<Plus aria-hidden="true" />}
              onClick={() => setInviteOpen(true)}
              disabled={!isAdmin || isSeatsFull}
              aria-describedby={showSeatsNotice ? seatsNoticeId : undefined}
            >
              Invite member
            </Button>
            {seats !== undefined && seatsUsed !== undefined && (
              <p className={styles.seats}>{`${formatUsageCount(seatsUsed, seats)} people`}</p>
            )}
          </div>
        </div>

        {showSeatsNotice && seats !== undefined && seatsUsed !== undefined && (
          <PlanLimitNotice
            id={seatsNoticeId}
            message={planLimitMessage({ reason: "seats", limit: seats, used: seatsUsed })}
          />
        )}

        {isError ? (
          <ErrorState title="We couldn't load settings" onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton lines={4} />
        ) : (
          <DataTable
            caption="Members"
            columns={columns}
            rows={items}
            getRowKey={(member) => member.id}
            renderActions={(member) => {
              const menuItems: MenuItemConfig[] = [
                ...(member.status === "invited"
                  ? [{ label: "Resend invite", onSelect: () => handleResendInvite(member) }]
                  : []),
                {
                  label: "Remove",
                  onSelect: () => handleRemoveSelected(member),
                  disabled: !isAdmin || Boolean(removeDisabledReason(member)),
                  title: removeDisabledReason(member),
                },
              ];
              return (
                <Menu
                  trigger={
                    <IconButton
                      ref={(element) => {
                        if (element) actionTriggerRefs.current.set(member.id, element);
                        else actionTriggerRefs.current.delete(member.id);
                      }}
                      icon={<MoreHorizontal aria-hidden="true" />}
                      aria-label={`Actions for ${member.name}`}
                      disabled={!isAdmin}
                    />
                  }
                  items={menuItems}
                />
              );
            }}
          />
        )}
      </Card>

      <Card className={styles.card}>
        <h2>Role permissions</h2>
        <dl className={styles.permissions}>
          {ROLE_PERMISSIONS.map((entry) => (
            <div key={entry.role}>
              <dt>{entry.role}</dt>
              <dd>{entry.description}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Modal
        open={inviteOpen}
        onOpenChange={handleInviteOpenChange}
        title="Invite member"
        returnFocusRef={inviteTriggerRef}
      >
        <form onSubmit={handleInviteSubmit} noValidate className={styles.form}>
          {inviteLimit && <PlanLimitNotice message={planLimitMessage(inviteLimit)} />}
          <FormField label="Email" error={inviteError}>
            <TextInput
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="name@company.com"
              disabled={inviteMutation.isPending}
            />
          </FormField>
          <FormField label="Role">
            <Select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as MemberRole)}
              disabled={inviteMutation.isPending}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleInviteOpenChange(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending}>
              Send invite
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title="Remove member?"
        description={
          removeTarget ? `${removeTarget.name} will lose access to this workspace.` : undefined
        }
        returnFocusRef={removeReturnFocusRef}
      >
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="reject"
            onClick={handleRemoveConfirmed}
            isLoading={removeMutation.isPending}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </>
  );
}
