import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../src/app/mocks/server";
import { resetReviewRulesStore } from "../src/app/mocks/fixtures/reviewRules.fixtures";
import { resetMembersStore } from "../src/app/mocks/fixtures/members.fixtures";
import { resetBatchesStore } from "../src/app/mocks/fixtures/batch.fixtures";
import { resetPlanStore, resetUsageStore } from "../src/app/mocks/fixtures/plans.fixtures";
import { resetMockNow } from "../src/app/mocks/support/mockNow";

// Full runs load the machine enough that mock round trips (300-700 ms) plus a slow render can
// pass the 1000 ms default, so a plain waitFor/findBy fails at random. Tests that prove
// something never appears wait a fixed time instead, so this does not weaken them.
configure({ asyncUtilTimeout: 5000 });

// RTL's automatic afterEach(cleanup) only self-registers when it detects
// global test hooks; with Vitest's `globals: false` it doesn't, so it's explicit here.
afterEach(() => cleanup());

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
// Review rules are mutated through a real PUT in tests that exercise the save
// flow (e.g. SettingsRulesPage), unlike other fixtures mocked at the hook level.
afterEach(() => resetReviewRulesStore());
// Batches, like review rules, are mutated through real requests (poll
// advance, bulk-approve) across several test files, so they're reset globally.
afterEach(() => resetBatchesStore());
// Plan/usage state and the mock clock override are likewise mutated through
// real requests (plan switch, creations) across several test files.
afterEach(() => resetPlanStore());
afterEach(() => resetUsageStore());
afterEach(() => resetMockNow());
// Invites and removals go through real requests, and the seats limit now depends on the list.
afterEach(() => resetMembersStore());
afterAll(() => server.close());
