import { z } from "zod";
export const collectionSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(60), lookIds: z.array(z.string().min(1).max(100)).max(100) });
export type Collection = z.infer<typeof collectionSchema>;
export const createCollectionSchema = collectionSchema.pick({ id: true, name: true }).strict();
export const updateCollectionSchema = z.discriminatedUnion("action", [
  createCollectionSchema.extend({ action: z.literal("rename") }),
  z.object({ action: z.literal("membership"), id: z.string().uuid(), lookId: z.string().min(1).max(100), included: z.boolean() }).strict(),
]);
