import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { updatedAt } from "./helper";

/**
 * 发动机浏览器等前端功能的数据源配置：管理员在后台填 R2 对象 key，
 * 前端经 /images/<key> 原样透传读取。单行表（id 恒为 1），空字符串
 * 表示未配置（前端回退内置默认路径）。内容更替由管理员换文件名完成，
 * 同名文件内容视为不可变（前端按扩展名启用一年期 immutable 缓存）。
 */
export const DataSourceSettingsTable = sqliteTable(
  "data_source_settings",
  {
    id: integer("id").primaryKey().notNull().default(1),
    engineModelKey: text("engine_model_key").notNull().default(""),
    engineDataKey: text("engine_data_key").notNull().default(""),
    cardSingleKey: text("card_single_key").notNull().default(""),
    cardDoubleKey: text("card_double_key").notNull().default(""),
    updatedAt,
  },
  (table) => [check("data_source_settings_singleton", sql`${table.id} = 1`)],
);

export type DataSourceSettings = typeof DataSourceSettingsTable.$inferSelect;
