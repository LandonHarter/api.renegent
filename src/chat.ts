import { createHono } from "./hono.js";
import { schemaValidator } from "./lib/validator.js";
import z from "zod";

const app = createHono();
app.post(
	"/",
	schemaValidator(
		"json",
		z.object({
			message: z.string().min(1),
		})
	),
	async (c) => {
		return c.json({ message: c.req.valid("json").message });
	}
);

export default app;
