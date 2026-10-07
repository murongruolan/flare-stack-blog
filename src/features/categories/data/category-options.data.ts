import { asc } from "drizzle-orm";
import { CategoriesTable } from "@/lib/db/schema";

export async function getCategoryOptions(db: DB) {
  return db
    .select({
      id: CategoriesTable.id,
      name: CategoriesTable.name,
      type: CategoriesTable.type,
    })
    .from(CategoriesTable)
    .orderBy(asc(CategoriesTable.name));
}
