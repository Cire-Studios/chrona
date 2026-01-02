import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface SignalTrend {
  week: string;
  delivery: number;
  ownership: number;
  influence: number;
  learning: number;
}

interface SignalTrendsChartProps {
  data: SignalTrend[];
}

const chartConfig = {
  delivery: { label: "Delivery", color: "hsl(var(--chart-1))" },
  ownership: { label: "Ownership", color: "hsl(var(--chart-2))" },
  influence: { label: "Influence", color: "hsl(var(--chart-3))" },
  learning: { label: "Learning", color: "hsl(var(--chart-4))" },
};

export const SignalTrendsChart = ({ data }: SignalTrendsChartProps) => {
  if (data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Signal Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No signal data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Signal Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ownershipGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="influenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="delivery"
              stroke="hsl(var(--chart-1))"
              fill="url(#deliveryGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="ownership"
              stroke="hsl(var(--chart-2))"
              fill="url(#ownershipGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="influence"
              stroke="hsl(var(--chart-3))"
              fill="url(#influenceGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="learning"
              stroke="hsl(var(--chart-4))"
              fill="url(#learningGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
