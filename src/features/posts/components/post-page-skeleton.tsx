import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { findCachedPublicPost } from "@/features/posts/utils/cached-public-post";
import { postDocCode } from "@/features/posts/utils/portal-media";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-md bg-black/[0.06] dark:bg-white/10", className)}
    />
  );
}

function LineGroup({ widths }: { widths: Array<string> }) {
  return (
    <div className="space-y-3">
      {widths.map((width, index) => (
        <Bone key={`${width}-${index}`} className={cn("h-3.5", width)} />
      ))}
    </div>
  );
}

/**
 * Loading placeholder that mirrors the article layout, keeping the cached
 * title and summary visible so the page does not jump while it resolves.
 */
export function PostPageSkeleton() {
  const { slug } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const cached =
    typeof slug === "string"
      ? findCachedPublicPost(queryClient, slug)
      : undefined;

  return (
    <div className="ueg-article-page">
      <div className="crumb">
        {cached ? (
          <>UEG / INFORMATION CENTER / NEWS / {postDocCode(cached)}</>
        ) : (
          <Bone className="h-3 w-72" />
        )}
      </div>

      <div className="article-layout">
        <article className="article">
          <header className="article-head">
            {cached ? (
              <span className="tag">
                {cached.category?.name ?? "ARCHIVE"}
              </span>
            ) : (
              <Bone className="h-5 w-16" />
            )}
            <h1>
              {cached ? (
                cached.title
              ) : (
                <Bone className="h-9 w-4/5" />
              )}
            </h1>
            <div className="meta">
              {cached ? (
                <>
                  <span>档案编号：{postDocCode(cached)}</span>
                  <span>公开级别：PUBLIC</span>
                </>
              ) : (
                <>
                  <Bone className="h-3 w-24" />
                  <Bone className="h-3 w-24" />
                  <Bone className="h-3 w-24" />
                </>
              )}
            </div>
          </header>

          <div className="article-body animate-pulse">
            {cached?.summary ? <p className="lead">{cached.summary}</p> : null}
            <div className="image-placeholder" aria-hidden="true" />
            <LineGroup
              widths={["w-full", "w-full", "w-[96%]", "w-[88%]"]}
            />
            <div className="mt-8">
              <Bone className="mb-4 h-6 w-2/5" />
              <LineGroup
                widths={["w-full", "w-full", "w-full", "w-[72%]"]}
              />
            </div>
            <div className="mt-8">
              <Bone className="mb-4 h-6 w-1/3" />
              <LineGroup
                widths={["w-full", "w-[94%]", "w-[81%]"]}
              />
            </div>
          </div>
        </article>

        <aside className="side">
          <div className="panel">
            <div className="panel-title">
              <h2>相关文章</h2>
              <small>RELATED</small>
            </div>
            <div className="animate-pulse space-y-4 pt-3">
              <Bone className="h-3 w-24" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-24" />
              <Bone className="h-3 w-full" />
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <h2>文章导航</h2>
              <small>CONTENTS</small>
            </div>
            <div className="animate-pulse space-y-4 pt-4">
              <Bone className="h-3 w-3/4" />
              <Bone className="h-3 w-2/3" />
              <Bone className="h-3 w-4/5" />
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <h2>申请服务</h2>
              <small>PUBLIC SERVICE</small>
            </div>
            <div className="animate-pulse pt-4">
              <Bone className="h-24 w-full" />
              <Bone className="mt-3 h-24 w-full" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
