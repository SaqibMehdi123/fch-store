"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Ruler } from "lucide-react";

type Row = [size: string, chest: string, waist: string, length: string];

const MEN: Row[] = [
  ["S", "38", "32", "40"],
  ["M", "40", "34", "41"],
  ["L", "42", "36", "42"],
  ["XL", "44", "38", "43"],
  ["XXL", "46", "40", "44"],
  ["30", "—", "30", "40 (inseam 30)"],
  ["32", "—", "32", "41 (inseam 30)"],
  ["34", "—", "34", "42 (inseam 31)"],
  ["36", "—", "36", "42 (inseam 31)"],
  ["38", "—", "38", "43 (inseam 32)"],
  ["40", "—", "40", "43 (inseam 32)"],
];

const WOMEN: Row[] = [
  ["S", "36", "28", "38–46"],
  ["M", "38", "30", "39–47"],
  ["L", "40", "32", "40–48"],
  ["XL", "42", "34", "41–48"],
  ["XXL", "44", "36", "41–48"],
  ["One Size", "up to 42", "up to 34", "3-Piece / unstitched"],
];

const KIDS: Row[] = [
  ["2-3Y", "24", "—", "22"],
  ["4-5Y", "26", "—", "24"],
  ["6-7Y", "28", "—", "26"],
  ["8-9Y", "30", "—", "28"],
  ["10-11Y", "32", "—", "30"],
];

function ChartTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-stone text-left">
          <th className="py-2.5 pr-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Size</th>
          <th className="py-2.5 pr-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Chest (in)</th>
          <th className="py-2.5 pr-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Waist (in)</th>
          <th className="py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Length (in)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([size, chest, waist, length]) => (
          <tr key={size} className="border-b border-stone/60 last:border-0">
            <td className="py-2.5 pr-3 font-medium">{size}</td>
            <td className="py-2.5 pr-3 text-foreground/80">{chest}</td>
            <td className="py-2.5 pr-3 text-foreground/80">{waist}</td>
            <td className="py-2.5 text-foreground/80">{length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Size chart modal — approximate measurements; owner can refine copy later.
 */
export function SizeChartDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-foreground/70 underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          <Ruler className="h-3.5 w-3.5" /> Size chart
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Size Chart</DialogTitle>
          <DialogDescription>
            Approximate garment measurements in inches. Fits may vary ±0.5" by style.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="men">
          <TabsList className="w-full justify-start rounded-none border-b border-stone bg-transparent p-0">
            {[
              ["men", "Men"],
              ["women", "Women"],
              ["kids", "Kids"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-0 border-b-2 border-transparent px-4 py-2.5 text-[12px] uppercase tracking-[0.14em] data-[state=active]:border-gold data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="men" className="mt-4">
            <ChartTable rows={MEN} />
          </TabsContent>
          <TabsContent value="women" className="mt-4">
            <ChartTable rows={WOMEN} />
          </TabsContent>
          <TabsContent value="kids" className="mt-4">
            <ChartTable rows={KIDS} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
