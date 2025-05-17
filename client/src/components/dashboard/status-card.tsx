import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatusCardProps = {
  icon: ReactNode;
  title: string;
  value: string | ReactNode;
  footer?: string | ReactNode;
};

export function StatusCard({ icon, title, value, footer }: StatusCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary bg-opacity-10 flex items-center justify-center mr-4">
            {icon}
          </div>
          <div>
            <h3 className="text-neutral-500 text-sm font-medium">{title}</h3>
            <p className="text-neutral-700 font-medium">{value}</p>
          </div>
        </div>
        {footer && (
          <div className="flex items-center text-sm text-neutral-500">
            <span>{footer}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
