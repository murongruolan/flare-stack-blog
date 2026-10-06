import { R2_DEV_CUSTOM_DOMAIN } from "@/lib/constants";
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

// 本地开发时 R2 模拟里没有线上新传的文件：HEAD 校验回退生产自定义域。
// 不能用 import.meta.env.DEV——vite 对 worker 模块不做静态替换，运行时
// 恒为 undefined；改用请求 host 判断（与 media.service 的 isLocalDev 一致）。
function isLocalHost(headers: Headers): boolean {
  const host = headers.get("host") ?? "";
  return /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/i.test(host);
}

async function r2ObjectExists(
  env: Env,
  key: string,
  headers: Headers,
): Promise<boolean> {
  if (await env.R2.head(key)) return true;
  if (!isLocalHost(headers) || key.includes("..")) return false;
  try {
    const upstream = await fetch(`${R2_DEV_CUSTOM_DOMAIN}/${key}`, {
      method: "HEAD",
    });
    return upstream.ok;
  } catch {
    return false;
  }
}

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
  context: { db: DB; env: Env; headers: Headers },
  input: EngineDataSourcesInput,
): Promise<Result<EngineDataSources, SaveDataSourceError>> {
  const modelKey = input.engineModelKey;
  const dataKey = input.engineDataKey;

  // 保存前逐个校验对象存在，避免把打错的对象 key 提交给全站前端。
  if (modelKey && !(await r2ObjectExists(context.env, modelKey, context.headers))) {
    return err({ reason: "MODEL_NOT_FOUND" });
  }
  if (dataKey && !(await r2ObjectExists(context.env, dataKey, context.headers))) {
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
