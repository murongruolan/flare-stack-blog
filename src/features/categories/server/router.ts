import { z } from "zod";
import {
  CategoryOptionSchema,
  CreateCategoryInputSchema,
  CreateStreamInputSchema,
  DeleteCategoryInputSchema,
  DeleteStreamInputSchema,
  GetCategoriesInputSchema,
  StreamSchema,
  UpdateCategoryInputSchema,
  UpdateStreamInputSchema,
} from "@/features/categories/categories.schema";
import * as CategoryService from "@/features/categories/categories.service";
import * as StreamService from "@/features/categories/category-streams.service";
import { adminProcedure, publicProcedure } from "@/lib/orpc/procedure";
import { unwrapResult } from "@/lib/orpc/unwrap-result";

const categoryErrors = {
  CATEGORY_NOT_FOUND: { status: 404, message: "Category not found." },
  CATEGORY_NAME_ALREADY_EXISTS: {
    status: 409,
    message: "Category name already exists.",
  },
  STREAM_NOT_FOUND: { status: 422, message: "Stream not found." },
} as const;

const streamErrors = {
  STREAM_NOT_FOUND: { status: 404, message: "Stream not found." },
  STREAM_NAME_ALREADY_EXISTS: {
    status: 409,
    message: "Stream name already exists.",
  },
  STREAM_RESERVED: {
    status: 409,
    message: "This stream is wired to a public page and cannot be deleted.",
  },
  STREAM_IN_USE: {
    status: 409,
    message: "Categories still reference this stream.",
  },
} as const;

const streamList = adminProcedure
  .route({
    method: "GET",
    path: "/admin/category-streams",
    summary: "List category streams",
    tags: ["Admin Categories"],
  })
  .output(z.array(StreamSchema))
  .handler(({ context }) => StreamService.getStreams(context));

const streamCreate = adminProcedure
  .errors(streamErrors)
  .route({
    method: "POST",
    path: "/admin/category-streams",
    summary: "Create a category stream",
    tags: ["Admin Categories"],
  })
  .input(CreateStreamInputSchema)
  .handler(({ context, input, errors }) =>
    unwrapResult(StreamService.createStream(context, input), {
      STREAM_NAME_ALREADY_EXISTS: () => {
        throw errors.STREAM_NAME_ALREADY_EXISTS();
      },
    }),
  );

const streamUpdate = adminProcedure
  .errors(streamErrors)
  .route({
    method: "PATCH",
    path: "/admin/category-streams/{id}",
    summary: "Rename a category stream",
    tags: ["Admin Categories"],
  })
  .input(UpdateStreamInputSchema)
  .handler(({ context, input, errors }) =>
    unwrapResult(StreamService.updateStream(context, input), {
      STREAM_NOT_FOUND: () => {
        throw errors.STREAM_NOT_FOUND();
      },
      STREAM_NAME_ALREADY_EXISTS: () => {
        throw errors.STREAM_NAME_ALREADY_EXISTS();
      },
    }),
  );

const streamRemove = adminProcedure
  .errors(streamErrors)
  .route({
    method: "DELETE",
    path: "/admin/category-streams/{id}",
    summary: "Delete a category stream",
    tags: ["Admin Categories"],
  })
  .input(DeleteStreamInputSchema)
  .handler(({ context, input, errors }) =>
    unwrapResult(StreamService.deleteStream(context, input), {
      STREAM_NOT_FOUND: () => {
        throw errors.STREAM_NOT_FOUND();
      },
      STREAM_RESERVED: () => {
        throw errors.STREAM_RESERVED();
      },
      STREAM_IN_USE: () => {
        throw errors.STREAM_IN_USE();
      },
    }),
  );

const list = publicProcedure
  .route({
    method: "GET",
    path: "/categories",
    summary: "List public categories",
    tags: ["Categories"],
  })
  .handler(({ context }) => CategoryService.getPublicCategories(context));

const adminList = adminProcedure
  .route({
    method: "GET",
    path: "/admin/categories",
    summary: "List categories for admin",
    tags: ["Admin Categories"],
  })
  .input(GetCategoriesInputSchema)
  .handler(({ context, input }) =>
    CategoryService.getCategories(context, input),
  );

const options = adminProcedure
  .route({
    method: "GET",
    path: "/admin/categories/options",
    summary: "List category options",
    tags: ["Admin Categories"],
  })
  .output(z.array(CategoryOptionSchema))
  .handler(({ context }) => CategoryService.getCategoryOptions(context));

const create = adminProcedure
  .errors(categoryErrors)
  .route({
    method: "POST",
    path: "/admin/categories",
    summary: "Create a category",
    tags: ["Admin Categories"],
  })
  .input(CreateCategoryInputSchema)
  .handler(({ context, input, errors }) =>
    unwrapResult(CategoryService.createCategory(context, input), {
      CATEGORY_NAME_ALREADY_EXISTS: () => {
        throw errors.CATEGORY_NAME_ALREADY_EXISTS();
      },
    }),
  );

const update = adminProcedure
  .errors(categoryErrors)
  .route({
    method: "PATCH",
    path: "/admin/categories/{id}",
    summary: "Update a category",
    tags: ["Admin Categories"],
  })
  .input(UpdateCategoryInputSchema)
  .handler(({ context, input, errors }) =>
    unwrapResult(CategoryService.updateCategory(context, input), {
      CATEGORY_NOT_FOUND: () => {
        throw errors.CATEGORY_NOT_FOUND();
      },
      CATEGORY_NAME_ALREADY_EXISTS: () => {
        throw errors.CATEGORY_NAME_ALREADY_EXISTS();
      },
    }),
  );

const remove = adminProcedure
  .errors(categoryErrors)
  .route({
    method: "DELETE",
    path: "/admin/categories/{id}",
    summary: "Delete a category",
    tags: ["Admin Categories"],
  })
  .input(DeleteCategoryInputSchema)
  .handler(({ context, input, errors }) =>
    unwrapResult(CategoryService.deleteCategory(context, input), {
      CATEGORY_NOT_FOUND: () => {
        throw errors.CATEGORY_NOT_FOUND();
      },
    }),
  );

export default {
  list,
  admin: {
    list: adminList,
    options,
    create,
    update,
    remove,
    streams: {
      list: streamList,
      create: streamCreate,
      update: streamUpdate,
      remove: streamRemove,
    },
  },
};
