import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
export const looks = sqliteTable(
  "looks",
  {
    owner: text("owner").notNull(),
    id: text("id").notNull(),
    payload: text("payload").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.owner, table.id] }),
    index("idx_looks_owner_created").on(table.owner, table.createdAt),
  ],
);
export const collections = sqliteTable("collections", {
  owner: text("owner").notNull(),
  id: text("id").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
}, (t) => [primaryKey({ columns: [t.owner, t.id] })]);
export const collectionItems = sqliteTable("collection_items", {
  owner: text("owner").notNull(),
  collectionId: text("collection_id").notNull(),
  lookId: text("look_id").notNull(),
}, (t) => [primaryKey({ columns: [t.owner, t.collectionId, t.lookId] }), index("idx_collection_items_owner_look").on(t.owner, t.lookId)]);
export const workspaces = sqliteTable("workspaces", {
  owner: text("owner").primaryKey(), payload: text("payload").notNull(), revision: integer("revision").notNull(),
});
