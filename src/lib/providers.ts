import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAzure } from "@ai-sdk/azure";
import { createXai } from "@ai-sdk/xai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createPerplexity } from "@ai-sdk/perplexity";
import type { Providers } from "@prisma/client";

export function getProvider(providerName: string, args: Providers) {
	switch (providerName) {
		case "OPENAI":
			return createOpenAI({
				apiKey: args.openaiApiKey || "",
				baseURL: args.openaiBaseUrl,
			});
		case "ANTHROPIC":
			return createAnthropic({
				apiKey: args.anthropicApiKey || "",
				baseURL: args.anthropicBaseUrl,
			});
		case "GOOGLE_GEN":
			return createGoogleGenerativeAI({
				apiKey: args.googleGenApiKey || "",
				baseURL: args.googleGenBaseUrl,
			});
		case "AZURE":
			return createAzure({
				apiKey: args.azureApiKey || "",
				resourceName: args.azureResourceName || "",
				apiVersion: "2024-12-01-preview",
			});
		case "X":
			return createXai({
				apiKey: args.xApiKey || "",
				baseURL: args.xBaseurl,
			});
		case "DEEPSEEK":
			return createDeepSeek({
				apiKey: args.deepseekApiKey || "",
				baseURL: args.deepseekBaseUrl,
			});
		case "PERPLEXITY":
			return createPerplexity({
				apiKey: args.perplexityApiKey || "",
				baseURL: args.perplexityBaseUrl,
			});
		default:
			throw new Error(`Provider ${providerName} not supported`);
	}
}
