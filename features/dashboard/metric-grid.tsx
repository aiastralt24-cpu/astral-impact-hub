import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricTile } from "@/types/domain";

export function MetricGrid({ metrics }: { metrics: MetricTile[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-transparent">
          <CardHeader>
            <CardTitle className="text-base text-[var(--foreground)]">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-extrabold tracking-[-0.05em] text-[var(--foreground)]">{metric.value}</p>
            <p className="mt-2 text-sm text-[var(--gray-mid)]">{metric.trend}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
