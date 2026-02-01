import { Card, CardBody, Progress } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Subject, AttendanceData } from "@/types/attendance";
import {
  getPercentageColor,
  calculateClassesNeeded,
} from "@/utils/attendance-utils";

interface SubjectCardProps {
  subject: Subject;
  summary: AttendanceData["summary"];
  index?: number;
}

export const SubjectCard = ({
  subject,
  summary,
  index = 0,
}: SubjectCardProps) => {
  const navigate = useNavigate();
  const present = parseInt(summary.overallPresent?.[subject.code] || "0");
  const total = parseInt(summary.overallClasses?.[subject.code] || "0");
  const pctStr = summary.overallPercentage?.[subject.code] || "0%";
  const pct = parseFloat(pctStr);

  const calc = calculateClassesNeeded(present, total);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      <Card
        isPressable
        className="w-full h-full border border-default-200 dark:border-default-100 bg-white dark:bg-default-50 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-visible"
        onPress={() => navigate(`/attendance/${subject.code}`)}
      >
        <CardBody className="p-5 flex flex-col justify-between h-full gap-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs font-bold text-default-400 uppercase tracking-wider bg-default-100 px-2 py-1 rounded-md w-fit">
                {subject.code}
              </span>
              <h3 className="font-bold text-lg leading-snug text-default-900 line-clamp-2">
                {subject.name}
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0">
              <div
                className={`flex items-center justify-center w-14 h-14 rounded-full border-4 font-bold text-sm ${
                  getPercentageColor(pct) === "success"
                    ? "border-success-500 text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20"
                    : getPercentageColor(pct) === "warning"
                      ? "border-warning-500 text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20"
                      : getPercentageColor(pct) === "danger"
                        ? "border-danger-500 text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20"
                        : "border-default-300 text-default-500"
                }`}
              >
                {pctStr}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-small text-default-500 font-medium">
              <span>Progress</span>
              <span>
                {present}/{total} Classes
              </span>
            </div>
            <Progress
              aria-label="Attendance percentage"
              className="h-2.5 rounded-full"
              classNames={{
                indicator: "bg-gradient-to-r from-blue-500 to-indigo-600",
              }}
              color={getPercentageColor(pct)}
              value={pct}
            />
          </div>

          {total > 0 && (
            <div
              className={`text-xs font-semibold px-3 py-2 rounded-lg border flex items-center gap-2 ${
                calc.type === "skip"
                  ? "bg-success-50/50 border-success-200 text-success-700 dark:text-success-400 dark:bg-success-900/20 dark:border-success-900/30"
                  : "bg-danger-50/50 border-danger-200 text-danger-700 dark:text-danger-600 dark:bg-danger-900/20 dark:border-danger-900/30"
              }`}
            >
              <span className="text-lg">
                {calc.type === "skip" ? "🎉" : "⚠️"}
              </span>
              {calc.type === "skip"
                ? calc.count > 0
                  ? `Can skip ${calc.count} class${calc.count !== 1 ? "es" : ""}`
                  : `Perfectly on track (75%)`
                : `Need ${calc.count} class${calc.count !== 1 ? "es" : ""} more`}
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
};
