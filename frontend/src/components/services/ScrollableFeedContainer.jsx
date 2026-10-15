import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Loader2, CheckCircle2, Sliders } from 'lucide-react';

export default function ScrollableFeedContainer({
  items = [],
  pageSize = 6,
  title,
  badgeText,
  renderItem,
  emptyState = null,
  lang = 'en',
  t = {},
  maxHeight = 'max-h-[580px]',
  headerAction = null
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Reset pagination when items array or search changes
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items.length, pageSize]);

  const total = items.length;
  const hasMore = visibleCount < total;
  const visibleItems = items.slice(0, visibleCount);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + pageSize, total));
      setIsLoadingMore(false);
    }, 200);
  }, [hasMore, isLoadingMore, pageSize, total]);

  // Infinite scroll on container scroll
  const handleContainerScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  };

  // IntersectionObserver on bottom sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  if (total === 0 && emptyState) {
    return (
      <div className="space-y-4">
        {title && (
          <div className="flex items-center justify-between">
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 font-outfit">{title}</h4>
            {badgeText && (
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                0 {badgeText}
              </span>
            )}
          </div>
        )}
        <div className="p-10 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          {emptyState.icon}
          <p className="text-sm font-bold text-slate-700">{emptyState.message}</p>
          {emptyState.onAction && (
            <button
              onClick={emptyState.onAction}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              {emptyState.actionText}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Container Header */}
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 font-outfit">{title}</h4>
            {badgeText && (
              <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200/60">
                {badgeText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {headerAction}
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
              {t.showingCount || 'Showing'} {Math.min(visibleCount, total)} {t.of || 'of'} {total}
            </span>
          </div>
        </div>
      )}

      {/* Modern Non-Grid Scrollable Container with Smooth Scrollbar */}
      <div className="rounded-3xl border border-slate-200/80 bg-slate-50/40 p-2 sm:p-4 shadow-inner">
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className={`${maxHeight} overflow-y-auto space-y-3.5 sm:space-y-4 pr-1 sm:pr-2 scroll-smooth`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}
        >
          {visibleItems.map((item, index) => renderItem(item, index))}

          {/* Sentinel & Infinite Scroll Indicator */}
          <div ref={sentinelRef} className="pt-2 pb-1 text-center">
            {isLoadingMore ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-xs text-slate-600 font-bold shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Loading more...</span>
              </div>
            ) : hasMore ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <button
                  onClick={loadMore}
                  className="px-5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>{t.loadMore || 'Load More'}</span>
                  <span className="text-[10px] text-teal-600 font-medium">({total - visibleCount} more)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400">
                  {t.scrollDownToLoadMore || 'Scroll down to load more'}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-500">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>{t.allLoaded || 'All listings loaded'} ({total})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
