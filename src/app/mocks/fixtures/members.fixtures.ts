export interface MemberFixture {
  id: string;
  name: string;
  email: string;
  role: "admin" | "reviewer" | "analyst";
  status: "active" | "invited";
  lastActiveAt?: string;
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** Mirrors the Figma export's members seed (App.tsx 2497-2519), given stable ids and roles,
 * plus the signed-in mock user (entities/session's MOCK_SESSION) as a real member row so
 * self/last-admin rules have something to apply to. */
function createMembersFixtures(): MemberFixture[] {
  return [
    {
      id: "member_alex_morgan",
      name: "Alex Morgan",
      email: "alex@northwind.example",
      role: "admin",
      status: "active",
      lastActiveAt: isoHoursAgo(0),
    },
    {
      id: "member_mina_patel",
      name: "Mina Patel",
      email: "mina@northwind.example",
      role: "reviewer",
      status: "active",
      lastActiveAt: isoHoursAgo(2),
    },
    {
      id: "member_jordan_lee",
      name: "Jordan Lee",
      email: "jordan@northwind.example",
      role: "analyst",
      status: "active",
      lastActiveAt: isoHoursAgo(24),
    },
    {
      id: "member_sam_rivera",
      name: "Sam Rivera",
      // Mirrors entities/session's MOCK_SESSION.email - the signed-in user's own row.
      email: "reviewer@hs-copilot.test",
      role: "admin",
      status: "active",
      lastActiveAt: isoHoursAgo(0),
    },
  ];
}

/** Immutable template for tests that assert against the original seed values/ids. */
export const membersFixtures: MemberFixture[] = createMembersFixtures();

/** Mutable, shared by every members handler (GET/invite/role-change/remove) so Settings'
 * own writes are visible on refetch without a page reload. */
export const membersStore: MemberFixture[] = createMembersFixtures();

export function resetMembersStore(): void {
  membersStore.splice(0, membersStore.length, ...createMembersFixtures());
}
