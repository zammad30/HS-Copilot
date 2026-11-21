// Lets page tests override MSW handlers for one case without importing the app layer
// from a page (which FSD forbids). It is the same instance tests/setup.ts listens on.
export { server } from "../src/app/mocks/server";
