import { PrismaClient } from "@prisma/client";
import { createHono } from "./hono.js";
import { schemaValidator } from "./lib/validator.js";
import z from "zod";
import { getProvider } from "./lib/providers.js";
import { generateText } from "ai";

const prisma = new PrismaClient();

const app = createHono();
app.post(
	"/completions",
	schemaValidator(
		"json",
		z.object({
			messages: z
				.array(
					z.object({
						content: z.string(),
						role: z.enum(["user", "assistant", "system"]),
					})
				)
				.min(1),
			model: z.string().min(1),
			prompt: z.string().min(1),
			max_completion_tokens: z.number().min(1).optional(),
			presence_penalty: z.number().min(-2).max(2).optional().default(0),
			temperature: z.number().min(0).max(1).optional().default(1),
			top_p: z.number().min(0).max(1).optional().default(1),
		})
	),
	async (c) => {
		const {
			messages,
			model,
			prompt,
			max_completion_tokens,
			presence_penalty,
			temperature,
			top_p,
		} = c.req.valid("json");
		const apiKey = c.get("apiKey");
		const providerKeys = c.get("providers");

		const user = await prisma.user.findFirst({
			where: {
				ApiKey: {
					some: {
						key: apiKey,
					},
				},
			},
		});
		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const renegentModel = await prisma.model.findFirst({
			where: {
				userId: user.id,
				modelId: model,
			},
		});
		if (!renegentModel) {
			return c.json({ error: "Model not found" }, 404);
		}

		const renegentPrompt = await prisma.prompt.findFirst({
			where: {
				userId: user.id,
				promptId: prompt,
			},
		});
		if (!renegentPrompt) {
			return c.json({ error: "Prompt not found" }, 404);
		}

		const provider = getProvider(renegentModel.provider, providerKeys);
		const sdkModel = provider(renegentModel.providerModelId);

		const result = await generateText({
			model: sdkModel,
			messages: [
				{
					role: "system",
					content: renegentPrompt.prompt,
				},
				...messages,
			],
			maxOutputTokens: max_completion_tokens,
			temperature,
			topP: top_p,
			presencePenalty: presence_penalty,
		});
		return c.json(result);
	}
);

export default app;
