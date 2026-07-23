'use client'

// Wraps a chunk of the tournament page in SWR polling. Uses the public
// `/api/tournaments/[slug]` endpoint, refreshes every 10s, pauses when the
// tab is hidden to avoid wasting requests. Passes the latest tournament data
// through a render-prop (function-as-children) so callers can re-render the
// parts that depend on live state.

import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(r => r.ok ? r.json() : Promise.reject(r))

export default function LivePoller({ slug, initialData, children }) {
  const { data, error } = useSWR(
    slug ? `/api/tournaments/${slug}` : null,
    fetcher,
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
      refreshWhenHidden: false,
      fallbackData: initialData,
      keepPreviousData: true,
    },
  )
  // On initial load SWR may hand back fallbackData; on error it keeps previous.
  const tournament = data ?? initialData
  return children({ tournament, isError: !!error, isPolling: !!data && !error })
}
