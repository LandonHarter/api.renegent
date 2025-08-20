import { PrismaClient } from "@prisma/client";
import { createHono } from "./hono.js";
import { schemaValidator } from "./lib/validator.js";
import z from "zod";
import { getProvider } from "./lib/providers.js";
import { generateText } from "ai";
import { useKnowledgeBase } from "./lib/tools.js";

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
			include: {
				KnowledgeBase: true,
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
					content: `You are a model deployed on the platform Renegent. You have access to a knowledge base that you can use to answer questions. You can use the knowledgeBase tool to access the knowledge base.
						
						You will be able to pull from the following knowledge bases (you won't be able to pull only from a single one, you will query and it will pull from all of them):
						${renegentModel.KnowledgeBase.map(
							(kb) => `- ${kb.name}: ${kb.description}`
						).join("\n")}
						`,
				},
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
			tools: {
				knowledgeBase: useKnowledgeBase(renegentModel.KnowledgeBase),
			},
		});
		return c.json(result);
	}
);

export default app;
