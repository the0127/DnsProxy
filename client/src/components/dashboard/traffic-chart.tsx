import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

interface TrafficData {
  name: string;
  value: number;
}

// Generate dummy data for display
const generateData = (days: number): TrafficData[] => {
  const data: TrafficData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const hours = i === 0 ? date.getHours() : 24;
    for (let h = 0; h < hours; h++) {
      const hour = h < 10 ? `0${h}` : `${h}`;
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const formattedDate = `${day}/${month} ${hour}:00`;
      
      // Generate random value between 50 and 200
      const value = Math.floor(Math.random() * 150) + 50;
      
      data.push({
        name: formattedDate,
        value,
      });
    }
  }
  
  return data;
};

type TimeRange = "24h" | "7d" | "30d";

type TrafficChartProps = {
  title?: string;
  subTitle?: string;
};

export function TrafficChart({ title = "DNS Traffic", subTitle }: TrafficChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  
  const getChartData = () => {
    switch (timeRange) {
      case "24h":
        return generateData(1);
      case "7d":
        return generateData(7).filter((_, i) => i % 6 === 0); // Every 6 hours
      case "30d":
        return generateData(30).filter((_, i) => i % 24 === 0); // Daily
      default:
        return generateData(1);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-700">{title}</h2>
            {subTitle && <p className="text-sm text-neutral-500">{subTitle}</p>}
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              variant={timeRange === "24h" ? "default" : "outline"}
              onClick={() => setTimeRange("24h")}
            >
              24h
            </Button>
            <Button 
              size="sm"
              variant={timeRange === "7d" ? "default" : "outline"}
              onClick={() => setTimeRange("7d")}
            >
              7d
            </Button>
            <Button 
              size="sm"
              variant={timeRange === "30d" ? "default" : "outline"}
              onClick={() => setTimeRange("30d")}
            >
              30d
            </Button>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#A19F9D"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (timeRange === "24h") return value.split(" ")[1];
                  return value;
                }}
              />
              <YAxis 
                stroke="#A19F9D"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickMargin={8}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "0.375rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
                formatter={(value: number) => [`${value} requests`, "Requests"]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Bar 
                dataKey="value" 
                fill="#0078D4" 
                radius={[4, 4, 0, 0]}
                name="Requests"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
