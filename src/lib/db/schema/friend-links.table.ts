import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth.table";
import { createdAt, id, updatedAt } from "./helper";

export const FRIEND_LINK_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export const FriendLinksTable = sqliteTable(
  "friend_links",
  {
    id,
    siteName: text("site_name").notNull(),
    siteUrl: text("site_url").notNull(),
    description: text(),
    logoUrl: text("logo_url"),
    status: text("status", { enum: FRIEND_LINK_STATUSES })
      .notNull()
      .default("pending"),
    rejectionReason: text("rejection_reason"),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt,
    // 展示排序：数字越小越靠前（页脚/友链页通用），默认 0。
    // 追加在表尾：SQLite 非交互迁移只能 ADD COLUMN，插中间会要求交互式重建
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("friend_links_status_created_idx").on(table.status, table.createdAt),
    index("friend_links_user_idx").on(table.userId),
  ],
);

// ==================== types ====================
export type FriendLink = typeof FriendLinksTable.$inferSelect;
export type FriendLinkStatus = (typeof FRIEND_LINK_STATUSES)[number];
