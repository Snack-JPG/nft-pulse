"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpikeBadge } from "./spike-badge";
import { Sparkline } from "./sparkline";
import type { SpikeLevel } from "@/lib/types";

interface TableRow {
  id: string;
  name: string;
  floorPriceSol: number;
  volume1h: number;
  volume24h: number;
  salesCount1h: number;
  uniqueBuyers1h: number;
  spikeLevel: SpikeLevel | null;
  /** Recent hourly volume snapshots for sparkline (oldest→newest) */
  volumeHistory?: number[];
}

const columnHelper = createColumnHelper<TableRow>();

const formatSol = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(v < 10 ? 2 : 0);

const columns = [
  columnHelper.display({
    id: "rank",
    header: "#",
    cell: (info) => (
      <span className="text-zinc-500 font-mono text-xs">
        {info.row.index + 1}
      </span>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("name", {
    header: "Collection",
    cell: (info) => (
      <span className="font-medium text-white">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("floorPriceSol", {
    header: "Floor",
    cell: (info) => (
      <span className="font-mono">{formatSol(info.getValue())} SOL</span>
    ),
  }),
  columnHelper.accessor("volume1h", {
    header: "1h Vol",
    cell: (info) => (
      <span className="font-mono text-purple-400">
        {formatSol(info.getValue())} SOL
      </span>
    ),
  }),
  columnHelper.display({
    id: "sparkline",
    header: "Trend",
    cell: (info) => (
      <Sparkline data={info.row.original.volumeHistory ?? []} />
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("volume24h", {
    header: "24h Vol",
    cell: (info) => (
      <span className="font-mono font-medium text-purple-400">
        {formatSol(info.getValue())} SOL
      </span>
    ),
  }),
  columnHelper.accessor("salesCount1h", {
    header: "1h Sales",
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.accessor("uniqueBuyers1h", {
    header: "Buyers",
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.accessor("spikeLevel", {
    header: "Status",
    cell: (info) => <SpikeBadge level={info.getValue()} />,
    enableSorting: false,
  }),
];

export function TrendingTable({ data }: { data: TableRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "volume1h", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-zinc-800 bg-zinc-900/50">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-zinc-400 font-medium cursor-pointer select-none hover:text-white transition-colors"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/collection/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
