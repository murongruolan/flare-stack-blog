import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EngineDataSourcesInput } from "@/features/engines/data-sources.schema";
import { engineDataSourcesQuery } from "@/features/engines/queries";
import { handleORPCError } from "@/lib/orpc/error-handler";
import { orpcClient } from "@/lib/orpc";
import { m } from "@/paraglide/messages";

const FIELD_CLASS =
  "settings-input h-10 w-full px-3 rounded-xl text-sm fuwari-text-90 outline-none font-mono";

const R2_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const MODEL_EXTENSION = /\.glb$/i;
const DATA_EXTENSION = /\.(geojson|json|csv)$/i;

function validateKey(value: string, extension: RegExp): string | null {
  if (value === "") return null;
  if (value.includes("..") || !R2_KEY_PATTERN.test(value)) {
    return m.engine_sources_invalid_key();
  }
  if (!extension.test(value)) {
    return m.engine_sources_invalid_ext();
  }
  return null;
}

/**
 * 系统设置 → 数据源：配置发动机模型 / 地理数据的 R2 对象 key。
 * 保存时服务端会 HEAD 校验对象存在；revision 仅在 key 变化时递增，
 * 驱动前端资源 URL 的 ?v= 版本号，命中一年期 immutable 缓存。
 */
export function EngineDataSourcesSection() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(engineDataSourcesQuery);

  const [modelKey, setModelKey] = useState(data.configured ? data.modelKey : "");
  const [dataKey, setDataKey] = useState(data.configured ? data.dataKey : "");
  const [formatError, setFormatError] = useState<string | null>(null);

  // query 失效/重取后同步最新已保存值
  useEffect(() => {
    setModelKey(data.configured ? data.modelKey : "");
    setDataKey(data.configured ? data.dataKey : "");
  }, [data.modelKey, data.dataKey, data.configured]);

  const saveMutation = useMutation({
    mutationFn: (input: EngineDataSourcesInput) =>
      orpcClient.engines.admin.update(input),
    onSuccess: (result) => {
      queryClient.setQueryData(engineDataSourcesQuery.queryKey, result);
      toast.success(m.engine_sources_saved_toast(), {
        description: m.engine_sources_saved_toast_desc(),
      });
    },
    onError: (error) => {
      handleORPCError(error, {
        defined: {
          MODEL_NOT_FOUND: () => toast.error(m.engine_sources_model_missing()),
          DATA_NOT_FOUND: () => toast.error(m.engine_sources_data_missing()),
        },
        fallback: () => toast.error(m.engine_sources_save_failed()),
      });
    },
  });

  const save = () => {
    const nextModel = modelKey.trim();
    const nextData = dataKey.trim();
    const problem =
      validateKey(nextModel, MODEL_EXTENSION) ??
      validateKey(nextData, DATA_EXTENSION);
    setFormatError(problem);
    if (problem) return;
    saveMutation.mutate({ engineModelKey: nextModel, engineDataKey: nextData });
  };

  return (
    <div className="settings-maintenance">
      <div className="settings-section-heading">
        <div>
          <h2>{m.engine_sources_title()}</h2>
          <p className="settings-muted">{m.engine_sources_hint()}</p>
        </div>
      </div>

      <div className="grid gap-4 py-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium fuwari-text-90">
            {m.engine_sources_model_label()}
          </span>
          <input
            type="text"
            value={modelKey}
            onChange={(event) => setModelKey(event.target.value)}
            placeholder="blog-media/engines/planetary-engine-draco.glb"
            spellCheck={false}
            className={FIELD_CLASS}
          />
          <span className="text-xs fuwari-text-50">
            {m.engine_sources_model_desc()}
          </span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium fuwari-text-90">
            {m.engine_sources_data_label()}
          </span>
          <input
            type="text"
            value={dataKey}
            onChange={(event) => setDataKey(event.target.value)}
            placeholder="blog-media/engines/engines.geojson"
            spellCheck={false}
            className={FIELD_CLASS}
          />
          <span className="text-xs fuwari-text-50">
            {m.engine_sources_data_desc()}
          </span>
        </label>
      </div>

      {formatError ? (
        <p role="alert" className="settings-operation-result text-red-500">
          {formatError}
        </p>
      ) : null}

      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={save}
          disabled={saveMutation.isPending}
          className="settings-button fuwari-btn-primary inline-flex items-center gap-2"
        >
          {saveMutation.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {m.engine_sources_save()}
        </button>
        {!data.configured && (
          <span className="text-xs fuwari-text-50">
            {m.engine_sources_default_note()}
          </span>
        )}
      </div>

      <p className="settings-muted">{m.engine_sources_cache_note()}</p>
    </div>
  );
}
