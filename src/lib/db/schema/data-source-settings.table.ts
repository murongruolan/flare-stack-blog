import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { updatedAt } from "./helper";

/**
 * 发动机浏览器等前端功能的数据源配置：管理员在后台填 R2 对象 key，
 * 前端经 /images/<key> 透传读取。单行表（id 恒为 1），空字符串表示
 * 未配置（前端回退内置默认路径）。revision 仅在 key 实际变化时递增，
 * 作为资源 URL 的 ?v= 缓存版本号。
 */
export const DataSourceSettingsTable = sqliteTable(
  "data_source_settings",
  {
    id: integer("id").primaryKey().notNull().default(1),
    engineModelKey: text("engine_model_key").notNull().default(""),
    engineDataKey: text("engine_data_key").notNull().default(""),
    revision: integer("revision").notNull().default(0),
    updatedAt,
  },
  (table) => [check("data_source_settings_singleton", sql`${table.id} = 1`)],
);

export type DataSourceSettings = typeof DataSourceSettingsTable.$inferSelect;
