import { Card, CardBody, Progress } from "@heroui/react";
import { useNavigate } from "react-router-dom";

import { Subject, AttendanceData } from "@/types/attendance";
import { calculateClassesNeeded } from "@/utils/attendance-utils";

interface SubjectCardProps {
  subject: Subject;
  summary: AttendanceData["summary"];
  index?: number;
}

export const SubjectCard = ({ subject, summary }: SubjectCardProps) => {
  const navigate = useNavigate();
  const present = parseInt(summary.overallPresent?.[subject.code] || "0");
  const total = parseInt(summary.overallClasses?.[subject.code] || "0");
  const pctStr = summary.overallPercentage?.[subject.code] || "0%";
  const pct = parseFloat(pctStr);

  const calc = calculateClassesNeeded(present, total);
  const atRisk = !isNaN(pct) && pct < 75;

  return (
    <Card
      isPressable
      className="apple-press w-full rounded-[18px] border border-[#e0e0e0] dark:border-[#2a2a2c] bg-white dark:bg-[#272729] shadow-none"
      onPress={() => navigate(`/attendance/${subject.code}`)}
    >
      <CardBody className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[12px] text-[#7a7a7a] dark:text-[#86868b]">
              {subject.code}
            </span>
            <h3 className="font-semibold text-[17px] leading-[1.24] tracking-[-0.02em] text-[#1d1d1f] dark:text-white line-clamp-2">
              {subject.name}
            </h3>
          </div>
          <p className="text-[34px] leading-none font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white shrink-0">
            {pctStr}
          </p>
        </div>

        <Progress
          aria-label={`${subject.code} attendance`}
          classNames={{
            base: "h-[6px]",
            track: "bg-[#e8e8ed] dark:bg-[#2a2a2c]",
            indicator: "bg-[#0066cc]",
          }}
          value={isNaN(pct) ? 0 : pct}
        />

        <div className="flex justify-between items-center">
          <p className="text-[14px] text-[#7a7a7a] dark:text-[#86868b]">
            {present} of {total} classes
          </p>
          {total > 0 && (
            <p
              className={`text-[14px] font-semibold ${
                atRisk
                  ? "text-[#c8102e] dark:text-[#ff6961]"
                  : "text-[#1a7f37] dark:text-[#7ee787]"
              }`}
            >
              {calc.type === "skip"
                ? calc.count > 0
                  ? `Can skip ${calc.count}`
                  : "On track"
                : `Need ${calc.count} more`}
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
