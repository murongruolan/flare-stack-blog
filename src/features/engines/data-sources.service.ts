import { err, ok, type Result } from "@/lib/errors";
import * as DataSourceRepo from "./data/data-sources.data";
import {
  type EngineDataSources,
  type EngineDataSourcesInput,
  EngineDataSourcesSchema,
} from "./data-sources.schema";
import {
  DEFAULT_ENGINE_DATA_KEY,
  DEFAULT_ENGINE_MODEL_KEY,
  engineAssetUrl,
} from "./lib/engine-assets";

export async function getEngineDataSources(context: {
  db: DB;
}): Promise<EngineDataSources> {
  const row = await DataSourceRepo.findDataSourceSettings(context.db);
  const modelKey = row?.engineModelKey || DEFAULT_ENGINE_MODEL_KEY;
  const dataKey = row?.engineDataKey || DEFAULT_ENGINE_DATA_KEY;
  return EngineDataSourcesSchema.parse({
    modelKey,
    dataKey,
    modelUrl: engineAssetUrl(modelKey),
    dataUrl: engineAssetUrl(dataKey),
    configured: Boolean(row?.engineModelKey || row?.engineDataKey),
  });
}

export type SaveDataSourceError =
  | { reason: "MODEL_NOT_FOUND" }
  | { reason: "DATA_NOT_FOUND" };

export async function saveEngineDataSources(
  context: { db: DB; env: Env },
  input: EngineDataSourcesInput,
): Promise<Result<EngineDataSources, SaveDataSourceError>> {
  const modelKey = input.engineModelKey;
  const dataKey = input.engineDataKey;

  // 保存前逐个 HEAD 校验，避免把打错的对象 key 提交给全站前端。
  if (modelKey && !(await context.env.R2.head(modelKey))) {
    return err({ reason: "MODEL_NOT_FOUND" });
  }
  if (dataKey && !(await context.env.R2.head(dataKey))) {
    return err({ reason: "DATA_NOT_FOUND" });
  }

  const row = await DataSourceRepo.upsertDataSourceSettings(context.db, {
    engineModelKey: modelKey,
    engineDataKey: dataKey,
  });

  const resolved = {
    modelKey: row.engineModelKey || DEFAULT_ENGINE_MODEL_KEY,
    dataKey: row.engineDataKey || DEFAULT_ENGINE_DATA_KEY,
    modelUrl: engineAssetUrl(row.engineModelKey || DEFAULT_ENGINE_MODEL_KEY),
    dataUrl: engineAssetUrl(row.engineDataKey || DEFAULT_ENGINE_DATA_KEY),
    configured: Boolean(row.engineModelKey || row.engineDataKey),
  };
  return ok(EngineDataSourcesSchema.parse(resolved));
}
