import { describe, expect, it } from "vitest";
import { fieldErrorsFrom, resetSchema, signInSchema, signUpSchema } from "./auth.schema";

describe("signInSchema", () => {
  it("accepts a valid email and any non-empty password", () => {
    const result = signInSchema.safeParse({ email: "alex@company.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("trims the email", () => {
    const result = signInSchema.safeParse({ email: "  alex@company.com  ", password: "x" });
    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe("alex@company.com");
  });

  it("rejects an email without a domain", () => {
    const result = signInSchema.safeParse({ email: "alex@company", password: "x" });
    expect(result.success).toBe(false);
    expect(fieldErrorsFrom(result).email).toBe("Enter a valid work email address.");
  });

  it("rejects an email over 254 characters", () => {
    const longEmail = `${"a".repeat(250)}@b.co`;
    const result = signInSchema.safeParse({ email: longEmail, password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({ email: "alex@company.com", password: "" });
    expect(result.success).toBe(false);
    expect(fieldErrorsFrom(result).password).toBe("Enter your password.");
  });

  it("does not require a minimum password length", () => {
    const result = signInSchema.safeParse({ email: "alex@company.com", password: "short" });
    expect(result.success).toBe(true);
  });
});

describe("signUpSchema", () => {
  it("requires a non-empty trimmed name", () => {
    const result = signUpSchema.safeParse({
      name: "   ",
      email: "alex@company.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(fieldErrorsFrom(result).name).toBe("Enter your full name.");
  });

  it("requires at least 8 characters for the password", () => {
    const result = signUpSchema.safeParse({
      name: "Alex Morgan",
      email: "alex@company.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    expect(fieldErrorsFrom(result).password).toBe("Password must be at least 8 characters.");
  });

  it("accepts valid values", () => {
    const result = signUpSchema.safeParse({
      name: "Alex Morgan",
      email: "alex@company.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("resetSchema", () => {
  it("only requires a valid email", () => {
    expect(resetSchema.safeParse({ email: "alex@company.com" }).success).toBe(true);
    expect(resetSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("fieldErrorsFrom", () => {
  it("returns an empty object for a successful parse", () => {
    const result = signInSchema.safeParse({ email: "alex@company.com", password: "x" });
    expect(fieldErrorsFrom(result)).toEqual({});
  });

  it("keeps only the first error per field", () => {
    const result = signUpSchema.safeParse({ name: "", email: "bad", password: "a" });
    const errors = fieldErrorsFrom(result);
    expect(Object.keys(errors)).toEqual(["name", "email", "password"]);
  });
});
