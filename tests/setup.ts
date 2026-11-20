import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../src/app/mocks/server";
import { resetReviewRulesStore } from "../src/app/mocks/fixtures/reviewRules.fixtures";
import { resetBatchesStore } from "../src/app/mocks/fixtures/batch.fixtures";
import { resetPlanStore, resetUsageStore } from "../src/app/mocks/fixtures/plans.fixtures";
import { resetMockNow } from "../src/app/mocks/support/mockNow";

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
afterAll(() => server.close());
