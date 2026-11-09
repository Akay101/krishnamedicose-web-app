import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_CONTENT, mergeContent } from "../content/defaults";

const SiteContentContext = createContext({ content: DEFAULT_CONTENT, loading: false });

// Fetched once per page load and shared by the header, landing sections and footer
export function SiteContentProvider({ children }) {
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.VITE_API_URL}/content`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setRemote(data))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ content: mergeContent(DEFAULT_CONTENT, remote), loading }), [remote, loading]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export const useSiteContent = () => useContext(SiteContentContext);
