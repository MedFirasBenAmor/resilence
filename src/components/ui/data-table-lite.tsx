import type { ReactNode } from "react";

type DataTableLiteProps = {
  headers: string[];
  rows: ReactNode[][];
};

export function DataTableLite({ headers, rows }: DataTableLiteProps) {
  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200/80 bg-white/92 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
      <table className="min-w-full divide-y divide-slate-200/80">
        <thead className="bg-slate-50/80">
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {headers.map((header) => (
              <th key={header} className="px-5 py-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="text-sm text-slate-700">
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`} className="px-5 py-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
