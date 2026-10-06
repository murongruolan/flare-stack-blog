import { Link } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";
import { EngineBrowser } from "./engine-browser";

/**
 * 首页「全球行星发动机网络」板块：发动机浏览器嵌入版（工具栏 + 地图），
 * 滚动进入视口才开始拉取 R2 数据；加载动画为雷达扫描样式。
 */
export function EngineNetworkSection({
  dataUrl,
  modelUrl,
}: {
  dataUrl: string;
  modelUrl: string;
}) {
  return (
    <section className="v2-engines" aria-label={m.ueg_section_engines()}>
      <div className="v2-section-head">
        <h2>
          <span aria-hidden="true">◉ </span>
          {m.ueg_section_engines()}
          <em className="v2-section-en">PLANETARY ENGINE NETWORK</em>
        </h2>
        <Link to="/engines" className="v2-more">
          {m.ueg_more()} <span aria-hidden="true">›</span>
        </Link>
      </div>
      <EngineBrowser
        variant="home"
        dataUrl={dataUrl}
        modelUrl={modelUrl}
        startWhenVisible
      />
    </section>
  );
}
