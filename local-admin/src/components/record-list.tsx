"use client";

import { Fragment, useEffect, useState } from "react";
import { Alert } from "@/components/status-screens";
import { formatCell, formatDetail, formatWhen, isHttpsUrl, rowKey, truncate, type DbRow } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { TABLE_VIEWS, type ColumnDef, type ViewId } from "@/lib/views";

const PAGE_SIZE = 25;

function Cell({ column, row }: { column: ColumnDef; row: DbRow }) {
  const value = row[column.key];
  if (column.format === "date") {
    return <span className="whitespace-nowrap text-muted">{formatWhen(value)}</span>;
  }
  if (column.format === "badge") {
    const label = formatCell(value);
    return (
      <span className="inline-flex rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-ink">
        {label}
      </span>
    );
  }
  if (column.format === "link") {
    const href = typeof value === "string" ? value : "";
    if (!isHttpsUrl(href)) return <span className="text-muted">—</span>;
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-teal hover:underline">
        Open
      </a>
    );
  }
  const text = formatCell(value);
  if (column.format === "clamp") {
    return <span className="line-clamp-2 max-w-xs text-ink">{text}</span>;
  }
  return <span className="text-ink">{truncate(text, 180)}</span>;
}

export function RecordList({ view }: { view: ViewId }) {
  const config = TABLE_VIEWS[view];
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<DbRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    void getSupabase()
      .from(config.table)
      .select("*", { count: "exact" })
      .order(config.order, { ascending: false })
      .range(from, to)
      .then(({ data, error: queryError, count }) => {
        if (!active) return;
        if (queryError) {
          setError(queryError.message);
          setRows([]);
          setTotal(null);
        } else {
          setError(null);
          setRows((data ?? []) as DbRow[]);
          setTotal(count ?? null);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [config.order, config.table, page]);

  const start = rows.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = page * PAGE_SIZE + rows.length;
  const hasNext = total != null ? end < total : rows.length === PAGE_SIZE;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          <p className="mt-1 text-sm text-muted">{config.description}</p>
        </div>
        <p className="text-xs text-faint">
          {loading ? "Loading…" : total != null ? `${start}–${end} of ${total}` : `${rows.length} rows`}
        </p>
      </header>
      {error ? <Alert>{error}</Alert> : null}
      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-panel-2 text-xs uppercase tracking-wide text-faint">
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-4 py-10 text-center text-muted">
                    No rows in this page.
                  </td>
                </tr>
              ) : null}
              {rows.map((row, index) => {
                const key = rowKey(row, index);
                const open = openKey === key;
                return (
                  <Fragment key={key}>
                    <tr className="border-t border-line">
                      {config.columns.map((column) => (
                        <td key={column.key} className="px-4 py-3 align-top">
                          <Cell column={column} row={row} />
                        </td>
                      ))}
                      <td className="px-4 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setOpenKey(open ? null : key)}
                          className="text-sm text-teal hover:underline"
                        >
                          {open ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-t border-line bg-panel-2/60">
                        <td colSpan={config.columns.length + 1} className="px-4 py-4">
                          <dl className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(row).map(([field, value]) => (
                              <div key={field} className="min-w-0 sm:col-span-2">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                                  {field}
                                </dt>
                                <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-ink">
                                  {formatDetail(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => {
            setOpenKey(null);
            setLoading(true);
            setPage((current) => Math.max(0, current - 1));
          }}
          className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext || loading}
          onClick={() => {
            setOpenKey(null);
            setLoading(true);
            setPage((current) => current + 1);
          }}
          className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
