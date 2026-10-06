import { Link } from "@tanstack/react-router";
import { withTagFilter } from "@/features/posts/utils/post-public-search";
import { m } from "@/paraglide/messages";

/**
 * Application service entries shown beside the news list. The visuals are pure
 * CSS (orbit rings for the navigator program, a perspective city grid for the
 * underground city) so they add no image weight.
 */
export function UegApplyCards() {
  return (
    <aside className="sidebar">
      <div className="sidehead">
        <h2>申请服务</h2>
      </div>

      <Link className="apply-card" to="/posts" search={withTagFilter("领航员")}>
        <div className="apply-visual navigator">
          <div className="orbit orbit-1" />
          <div className="orbit orbit-2" />
          <div className="orbit-dot" />
          <div className="visual-line line-1" />
          <div className="visual-line line-2" />
        </div>
        <div className="apply-content">
          <div className="apply-title">{m.ueg_feature_navigator_title()}</div>
          <div className="apply-desc">{m.ueg_feature_navigator_desc()}</div>
          <span className="apply-btn">
            {m.ueg_feature_navigator_cta()} <b>→</b>
          </span>
        </div>
      </Link>

      <Link className="apply-card" to="/posts" search={withTagFilter("地下城")}>
        <div className="apply-visual underground">
          <div className="city-grid" />
          <div className="city-core" />
          <div className="city-line city-line-1" />
          <div className="city-line city-line-2" />
          <div className="city-line city-line-3" />
        </div>
        <div className="apply-content">
          <div className="apply-title">{m.ueg_feature_underground_title()}</div>
          <div className="apply-desc">{m.ueg_feature_underground_desc()}</div>
          <span className="apply-btn">
            {m.ueg_feature_underground_cta()} <b>→</b>
          </span>
        </div>
      </Link>
    </aside>
  );
}
