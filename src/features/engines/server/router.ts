import {
  EngineDataSourcesInputSchema,
  EngineDataSourcesSchema,
} from "@/features/engines/data-sources.schema";
import * as DataSourceService from "@/features/engines/data-sources.service";
import { adminProcedure, publicProcedure } from "@/lib/orpc/procedure";
import { unwrapResult } from "@/lib/orpc/unwrap-result";

const dataSourceErrors = {
  MODEL_NOT_FOUND: {
    status: 422,
    message: "The R2 object for the engine model key does not exist.",
  },
  DATA_NOT_FOUND: {
    status: 422,
    message: "The R2 object for the engine data key does not exist.",
  },
} as const;

const getDataSources = publicProcedure
  .route({
    method: "GET",
    path: "/engines/data-sources",
    summary: "Get engine data source URLs",
    description:
      "Returns the admin-configured R2 keys with ready-to-use /images URLs. An empty configuration falls back to the built-in default keys.",
    tags: ["Engines"],
  })
  .output(EngineDataSourcesSchema)
  .handler(({ context }) => DataSourceService.getEngineDataSources(context));

const updateDataSources = adminProcedure
  .errors(dataSourceErrors)
  .route({
    method: "PUT",
    path: "/admin/engines/data-sources",
    summary: "Update engine data sources",
    description:
      "Validates each non-empty R2 key with a HEAD request before storing. The cache revision only increases when a key actually changes, so unchanged assets keep their browser and edge caches.",
    tags: ["Admin Engines"],
  })
  .input(EngineDataSourcesInputSchema)
  .output(EngineDataSourcesSchema)
  .handler(({ context, input, errors }) =>
    unwrapResult(DataSourceService.saveEngineDataSources(context, input), {
      MODEL_NOT_FOUND: () => {
        throw errors.MODEL_NOT_FOUND();
      },
      DATA_NOT_FOUND: () => {
        throw errors.DATA_NOT_FOUND();
      },
    }),
  );

export default {
  getDataSources,
  admin: { update: updateDataSources },
};
