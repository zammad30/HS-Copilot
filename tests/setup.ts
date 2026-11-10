import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../src/app/mocks/server";

// RTL's automatic afterEach(cleanup) only self-registers when it detects
// global test hooks; with Vitest's `globals: false` it doesn't, so it's explicit here.
afterEach(() => cleanup());

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
