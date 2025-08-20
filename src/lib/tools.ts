import { embed, tool } from "ai";
import z from "zod";
import { voyage } from "voyage-ai-provider";
import { PrismaClient, type KnowledgeBase } from "@prisma/client";

const prisma = new PrismaClient();

const embeddingModel = voyage.textEmbeddingModel("voyage-3.5-lite");
export const useKnowledgeBase = (knowledgeBases: KnowledgeBase[]) =>
	tool({
		description:
			"Use this tool to access the knowledge base. You will input a query which will be used to search the knowledge base.",
		inputSchema: z.object({
			query: z
				.string()
				.describe("The query to search the knowledge base."),
		}),
		execute: async ({ query }) => {
			console.log("Using the knowledge base!");

			const embedding = await embed({
				model: embeddingModel,
				value: query,
			});

			const allDataSources = await prisma.dataSource.findMany({
				where: {
					KnowledgeBase: {
						some: {
							id: {
								in: knowledgeBases.map((kb) => kb.id),
							},
						},
					},
				},
				select: {
					id: true,
				},
			});

			const dataSourceIds = allDataSources.map((ds) => ds.id);
			if (dataSourceIds.length === 0) {
				return "No data sources found in the specified knowledge bases.";
			}

			const results = await prisma.$queryRawUnsafe(
				`
				SELECT id, content
				FROM data_fragments
				WHERE "dataSourceId" = ANY($1::text[])
				ORDER BY embedding <=> $2::vector
				LIMIT 5
			`,
				dataSourceIds,
				`[${embedding.embedding.join(",")}]`
			);

			return results;
		},
	});
