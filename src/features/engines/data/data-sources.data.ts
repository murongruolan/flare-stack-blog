import { eq } from "drizzle-orm";
import { DataSourceSettingsTable } from "@/lib/db/schema";

export async function findDataSourceSettings(db: DB) {
  return await db.query.DataSourceSettingsTable.findFirst({
    where: eq(DataSourceSettingsTable.id, 1),
  });
}

export async function upsertDataSourceSettings(
  db: DB,
  values: {
    engineModelKey: string;
    engineDataKey: string;
  },
) {
  const [row] = await db
    .insert(DataSourceSettingsTable)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({
      target: DataSourceSettingsTable.id,
      set: values,
    })
    .returning();
  return row;
}
