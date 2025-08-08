import type { Providers } from "@prisma/client";
import { Hono } from "hono";

export function createHono() {
	return new Hono<{
		Variables: {
			apiKey: string;
			providers: Providers;
		};
	}>();
}
