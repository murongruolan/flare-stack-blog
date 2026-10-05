export function PostsPageSkeleton() {
  return (
    <div className="ueg-news-page">
      <section className="head">
        <div className="crumb">UEG / INFORMATION CENTER / NEWS</div>
        <h1>
          新闻动态 <span>NEWS &amp; INFORMATION</span>
        </h1>
      </section>
      <section className="layout">
        <div className="list">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card is-skeleton">
              <span className="thumb" />
              <div className="body">
                <div className="sk-line w-30" />
                <div className="sk-line w-70" />
                <div className="sk-line w-90" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
