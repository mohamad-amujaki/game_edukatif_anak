import { type AdminLevelRow, adminApi } from '@/api-admin';
import { Button } from '@/components/ui/Button';
import { Link } from '@tanstack/react-router';
import {
  type ColumnDef,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';

type ContentActivityTableRow = {
  levelId: string;
  levelTitle: string;
  track: string;
  ageMode: string;
  levelOrder: number;
  activityId: string;
  activityTitle: string;
  activityType: string;
  activityOrder: number;
  estimatedSec: number;
};

const globalFilterFn: FilterFn<ContentActivityTableRow> = (
  row,
  _columnId,
  filterValue,
) => {
  const q = String(filterValue ?? '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  const haystack = [
    r.levelTitle,
    r.track,
    r.ageMode,
    r.activityTitle,
    r.activityType,
    String(r.levelOrder),
    String(r.activityOrder),
    String(r.estimatedSec),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
};

function flattenLevels(levels: AdminLevelRow[]): ContentActivityTableRow[] {
  return levels.flatMap((lv) =>
    lv.activities.map((a) => ({
      levelId: lv.id,
      levelTitle: lv.title,
      track: lv.track,
      ageMode: lv.ageMode,
      levelOrder: lv.order,
      activityId: a.id,
      activityTitle: a.title,
      activityType: a.type,
      activityOrder: a.order,
      estimatedSec: a.estimatedSec,
    })),
  );
}

export function AdminContentPage() {
  const [levels, setLevels] = useState<AdminLevelRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getLevels()
      .then((data) => {
        if (!cancelled) setLevels(data);
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat level'),
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => flattenLevels(levels), [levels]);

  const columns = useMemo<ColumnDef<ContentActivityTableRow>[]>(
    () => [
      {
        accessorKey: 'levelTitle',
        header: 'Level',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <p className="font-medium text-neutral-900">{r.levelTitle}</p>
              <p className="text-xs text-neutral-500">
                {r.ageMode} · {r.track} · urutan {r.levelOrder}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'activityTitle',
        header: 'Aktivitas',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <p className="font-medium text-neutral-900">{r.activityTitle}</p>
              <p className="text-xs text-neutral-500">
                {r.activityType} · urutan {r.activityOrder}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'estimatedSec',
        header: 'Estimasi',
        cell: ({ row }) => (
          <span className="tabular-nums">~{row.original.estimatedSec}s</span>
        ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/content/activities/$activityId"
                params={{ activityId: a.activityId }}
                className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
              >
                Edit aktivitas
              </Link>
              <Link
                to="/admin/banks/$activityId"
                params={{ activityId: a.activityId }}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Bank soal
              </Link>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    state: { globalFilter },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  const totalRows = data.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, filteredCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Konten</h1>
        <p className="mt-1 text-neutral-600">
          Level dan aktivitas — edit metadata/payload atau bank soal per
          aktivitas. Setiap baris adalah satu aktivitas.
        </p>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-md flex-1 flex-col gap-1 text-sm">
          <span className="font-semibold text-neutral-700">Cari</span>
          <input
            type="search"
            placeholder="Judul level, aktivitas, track, tipe…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
          />
        </label>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="whitespace-nowrap">Baris per halaman</span>
          <select
            className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-neutral-800"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-neutral-400">Memuat…</p>
      ) : !err && totalRows === 0 ? (
        <p className="text-center text-neutral-400">Belum ada data level.</p>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            {filteredCount === totalRows
              ? `${totalRows} aktivitas`
              : `${filteredCount} dari ${totalRows} aktivitas cocok filter`}
            {filteredCount > 0 ? ` · Menampilkan ${start}–${end}` : null}
          </p>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 font-semibold text-neutral-800"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-neutral-400"
                    >
                      Tidak ada baris yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4 align-top">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredCount > 0 ? (
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-neutral-500">
                Halaman {pageIndex + 1}
                {pageCount > 0 ? ` dari ${pageCount}` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 min-w-0 px-3 py-2 text-sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.setPageIndex(0)}
                >
                  Pertama
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 min-w-0 px-3 py-2 text-sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 min-w-0 px-3 py-2 text-sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Berikutnya
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 min-w-0 px-3 py-2 text-sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.setPageIndex(pageCount - 1)}
                >
                  Terakhir
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
