import { http, HttpResponse } from "msw";
import { z } from "zod";
import { env } from "@/shared/config";
import { jurisdictionSchema } from "@/entities/classification";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import {
  answerAgentRun,
  createRunAndClassification,
  pollAgentRun,
} from "../fixtures/agentRuns.fixtures";

const createClassificationBodySchema = z.object({
  description: z.string().trim().min(1).max(1000),
  attributes: z.object({
    material: z.string().optional(),
    intendedUse: z.string().optional(),
    origin: z.string().optional(),
  }),
  jurisdiction: jurisdictionSchema,
});

const answerBodySchema = z.object({
  optionIndex: z.number(),
});

function notFound(): Response {
  return HttpResponse.json(
    { error: { code: "not_found", message: "Agent run not found" } },
    { status: 404 },
  );
}

function validationError(message: string): Response {
  return HttpResponse.json({ error: { code: "validation_error", message } }, { status: 422 });
}

export const agentRunsHandlers = [
  http.post(`${env.apiBaseUrl}/classifications`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = await request.json().catch(() => undefined);
    const result = createClassificationBodySchema.safeParse(body);
    if (!result.success) {
      return validationError("Enter a product description.");
    }

    const { classificationId, agentRunId } = createRunAndClassification(result.data);
    return HttpResponse.json({ classificationId, agentRunId });
  }),

  http.get(`${env.apiBaseUrl}/agent-runs/:id`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const run = pollAgentRun(String(params.id));
    if (!run) return notFound();

    return HttpResponse.json(run);
  }),

  http.post(`${env.apiBaseUrl}/agent-runs/:id/answer`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = await request.json().catch(() => undefined);
    const parsed = answerBodySchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Choose one of the options.");
    }

    const result = answerAgentRun(String(params.id), parsed.data.optionIndex);
    if (!result) return notFound();
    if (!result.ok) {
      const status = result.code === "invalid_option" ? 422 : 409;
      return HttpResponse.json(
        { error: { code: result.code, message: "Couldn't record that answer." } },
        { status },
      );
    }

    return HttpResponse.json(result.run);
  }),
];
