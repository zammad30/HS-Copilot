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

/** Mirrors the Figma export's members seed (App.tsx 2497-2519), given stable ids and roles. */
export const membersFixtures: MemberFixture[] = [
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
];
