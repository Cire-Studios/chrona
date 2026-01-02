import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PatternCategoryBadge } from "@/components/quarterly/PatternCategoryBadge";

interface PatternData {
  category: string;
  count: number;
  label: string;
}

interface PatternBreakdownProps {
  data: PatternData[];
}

const categoryColors: Record<string, string> = {
  growth: "hsl(var(--chart-1))",
  scope_change: "hsl(var(--chart-2))",
  sustained_impact: "hsl(var(--chart-3))",
  skill_development: "hsl(var(--chart-4))",
  leadership: "hsl(var(--chart-5))",
  collaboration: "hsl(142 76% 36%)",
};

export const PatternBreakdown = ({ data }: PatternBreakdownProps) => {
  const totalPatterns = data.reduce((sum, d) => sum + d.count, 0);

  if (totalPatterns === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Pattern Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No patterns identified yet</p>
              <p className="text-sm mt-1">Complete quarterly distillation to see patterns</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = data.reduce((acc, item) => ({
    ...acc,
    [item.category]: { label: item.label, color: categoryColors[item.category] }
  }), {} as Record<string, { label: string; color: string }>);

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Pattern Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ChartContainer config={chartConfig} className="h-[160px] w-[160px]">
            <PieChart>
              <Pie
                data={data.filter(d => d.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="count"
              >
                {data.filter(d => d.count > 0).map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={categoryColors[entry.category]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>

          <div className="flex-1 space-y-2">
            {data
              .filter((d) => d.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <PatternCategoryBadge category={item.category as any} />
                  <span className="font-medium text-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <span className="text-2xl font-bold text-foreground">{totalPatterns}</span>
          <span className="text-muted-foreground ml-2">total confirmed patterns</span>
        </div>
      </CardContent>
    </Card>
  );
};
