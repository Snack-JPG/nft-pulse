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
import { SpikeBadge } from "./spike-badge";
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
}

const columnHelper = createColumnHelper<TableRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Collection",
    cell: (info) => (
      <span className="font-medium text-white">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("floorPriceSol", {
    header: "Floor",
    cell: (info) => (
      <span className="font-mono">{info.getValue().toFixed(2)} SOL</span>
    ),
  }),
  columnHelper.accessor("volume1h", {
    header: "1h Vol",
    cell: (info) => (
      <span className="font-mono text-purple-400">
        {info.getValue().toLocaleString()} SOL
      </span>
    ),
  }),
  columnHelper.accessor("volume24h", {
    header: "24h Vol",
    cell: (info) => (
      <span className="font-mono font-medium text-purple-400">
        {info.getValue().toLocaleString()} SOL
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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "volume24h", desc: true },
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
            <tr key={row.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer">
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
