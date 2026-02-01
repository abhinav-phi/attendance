import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Progress,
  Button,
  Chip,
} from "@heroui/react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import { AppNavbar } from "@/components/app-navbar";
import { Footer } from "@/components/footer";
import { useAppContext } from "@/context/app-context";
import {
  getPercentageColor,
  calculateClassesNeeded,
} from "@/utils/attendance-utils";

export const SubjectDetailPage = () => {
  const { subjectCode } = useParams<{ subjectCode: string }>();
  const navigate = useNavigate();
  const { attendance } = useAppContext();

  if (!attendance || !subjectCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 shadow-xl">
          <CardBody className="items-center text-center">
            <AlertCircle className="text-warning-500 mb-4" size={48} />
            <p className="text-lg font-semibold mb-2">No data available</p>
            <p className="text-default-500 mb-4">
              Please login again to view attendance.
            </p>
            <Button color="primary" onPress={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const subject = attendance.subjects.find((s) => s.code === subjectCode);

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 shadow-xl">
          <CardBody className="items-center text-center">
            <p className="text-lg font-semibold mb-4">Subject not found</p>
            <Button onPress={() => navigate("/")}>Go Back</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const summary = attendance.summary;
  const present = parseInt(summary.overallPresent?.[subjectCode] || "0");
  const total = parseInt(summary.overallClasses?.[subjectCode] || "0");
  const absent = parseInt(summary.overallAbsent?.[subjectCode] || "0");
  const pctStr = summary.overallPercentage?.[subjectCode] || "0%";
  const pct = parseFloat(pctStr);

  const calc = calculateClassesNeeded(present, total);

  // Filter daily attendance - already sorted by latest first from backend
  const dailyRecords = attendance.dailyAttendance
    .filter((day) => {
      const val = day.records[subjectCode];

      return val && val.trim() !== "";
    })
    .map((day) => ({
      date: day.date,
      month: day.month || day.date.split("-")[0],
      value: day.records[subjectCode],
    }));

  // Group records by month for display with headings
  const groupedByMonth = dailyRecords.reduce(
    (acc, record) => {
      const month = record.month;

      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(record);

      return acc;
    },
    {} as Record<string, typeof dailyRecords>,
  );

  // Get months in order (latest first - from the already sorted records)
  const monthOrder = Object.keys(groupedByMonth);

  // Helper to get the year for a month based on academic year
  // Academic year 2025-26 means Jul-Dec 2025 and Jan-Jun 2026
  const getYearForMonth = (monthAbbr: string): number => {
    const academicYear = attendance.studentInfo?.year || "2025-26";
    const yearParts = academicYear.split("-");
    const firstYear = parseInt("20" + yearParts[0].slice(-2));
    const secondYear = firstYear + 1;

    const monthsInSecondYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    return monthsInSecondYear.includes(monthAbbr) ? secondYear : firstYear;
  };

  // Month full names mapping
  const monthFullNames: Record<string, string> = {
    Jan: "January",
    Feb: "February",
    Mar: "March",
    Apr: "April",
    May: "May",
    Jun: "June",
    Jul: "July",
    Aug: "August",
    Sep: "September",
    Oct: "October",
    Nov: "November",
    Dec: "December",
  };

  const renderAttendanceValue = (val: string) => {
    if (val === "1")
      return (
        <Chip
          classNames={{ base: "bg-success-50 border-success-200" }}
          color="success"
          size="sm"
          startContent={<CheckCircle2 size={14} />}
          variant="faded"
        >
          Present
        </Chip>
      );
    if (val === "0")
      return (
        <Chip
          classNames={{ base: "bg-danger-50 border-danger-200" }}
          color="danger"
          size="sm"
          startContent={<XCircle size={14} />}
          variant="faded"
        >
          Absent
        </Chip>
      );
    if (val.includes("+")) {
      if (val == "1+1") {
        return (
          <Chip
            classNames={{ base: "bg-success-50 border-success-200" }}
            color="success"
            size="sm"
            startContent={<CheckCircle2 size={14} />}
            variant="faded"
          >
            Present {val}
          </Chip>
        );
      } else if (val == "0+0") {
        return (
          <Chip
            classNames={{ base: "bg-danger-50 border-danger-200" }}
            color="danger"
            size="sm"
            startContent={<XCircle size={14} />}
            variant="faded"
          >
            Absent {val}
          </Chip>
        );
      }

      return (
        <Chip
          color="warning"
          size="sm"
          startContent={<CheckCircle2 size={14} />}
          variant="flat"
        >
          Extra {val}
        </Chip>
      );
    }

    return (
      <Chip size="sm" variant="flat">
        {val}
      </Chip>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-black">
      <AppNavbar />

      <div className="flex-grow w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Navigation */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
        >
          <Button
            isIconOnly
            className="bg-white/50 dark:bg-default-100 hover:bg-white dark:hover:bg-default-200"
            variant="light"
            onPress={() => navigate("/")}
          >
            <ArrowLeft className="text-default-600" size={20} />
          </Button>
          <div>
            <p className="text-sm font-medium text-default-500">
              Back to Dashboard
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
          >
            <Card className="shadow-md border-t-4 border-t-primary">
              <CardHeader className="px-6 py-5 flex flex-col items-start gap-1 bg-white dark:bg-default-50">
                <div className="flex justify-between w-full items-start">
                  <div>
                    <h1 className="text-2xl font-bold leading-tight w-full max-w-xl">
                      {subject.name}
                    </h1>
                    <p className="font-mono text-sm text-primary-800 font-medium mt-1 bg-primary-50 dark:bg-primary-300/30 w-fit px-2 py-0.5 rounded">
                      {subject.code}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`text-3xl font-bold ${getPercentageColor(pct) === "success" ? "text-success-600 dark:text-success-400" : getPercentageColor(pct) === "warning" ? "text-warning-600 dark:text-warning-400" : "text-danger-600 dark:text-danger-400"}`}
                    >
                      {pctStr}
                    </span>
                    <span className="text-xs text-default-400">
                      Total Attendance
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="px-6 py-6 border-t border-default-100 bg-white/50 dark:bg-default-50/50">
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2 font-medium text-default-600">
                    <span>Attendance Progress</span>
                    <span>
                      {present} / {total} Classes
                    </span>
                  </div>
                  <Progress
                    classNames={{
                      indicator: "bg-gradient-to-r from-blue-500 to-indigo-600",
                    }}
                    color={getPercentageColor(pct)}
                    showValueLabel={false}
                    size="lg"
                    value={pct}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {total}
                    </span>
                    <span className="text-xs uppercase font-semibold text-blue-400 dark:text-blue-300">
                      Total
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {present}
                    </span>
                    <span className="text-xs uppercase font-semibold text-green-400 dark:text-green-300">
                      Present
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                      {absent}
                    </span>
                    <span className="text-xs uppercase font-semibold text-red-400 dark:text-red-300">
                      Absent
                    </span>
                  </div>
                </div>

                {total > 0 && (
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      calc.type === "skip"
                        ? "bg-success-50 border-success-200 dark:bg-success-900/10 dark:border-success-800"
                        : "bg-danger-50 border-danger-200 dark:bg-danger/5 dark:border-danger-800"
                    }`}
                  >
                    <div
                      className={`mt-0.5 p-1 rounded-full ${calc.type === "skip" ? "bg-success-200 text-success-700 dark:bg-success-900/50 dark:text-success-300" : "bg-danger-200 text-danger-700 dark:bg-danger-900/50 dark:text-danger-300"}`}
                    >
                      {calc.type === "skip" ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-sm ${calc.type === "skip" ? "text-success-800 dark:text-success-300" : "text-danger-800 dark:text-danger-500"}`}
                      >
                        {calc.type === "skip"
                          ? "Safe Zone"
                          : "Improvement Needed"}
                      </h4>
                      <p
                        className={`text-sm mt-0.5 ${calc.type === "skip" ? "text-success-700 dark:text-success-400" : "text-danger-700 dark:text-danger-800"}`}
                      >
                        {calc.type === "skip"
                          ? calc.count > 0
                            ? `You can safely skip the next ${calc.count} class${calc.count !== 1 ? "es" : ""} and stay above 75%.`
                            : `You are exactly on the edge. Attend the next class!`
                          : `You need to attend ${calc.count} more class${calc.count !== 1 ? "es" : ""} consecutively to reach 75%.`}
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* Right Column: History */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-md h-full max-h-[600px] flex flex-col">
              <CardHeader className="bg-default-50 border-b border-default-100 py-4 px-5">
                <h3 className="font-bold text-medium flex items-center gap-2">
                  <CalendarDaysIcon />
                  Daily History
                </h3>
              </CardHeader>
              <CardBody className="p-0 overflow-y-auto custom-scrollbar">
                {dailyRecords.length > 0 ? (
                  <div className="divide-y divide-default-100">
                    {monthOrder.map((month) => (
                      <div key={month}>
                        {/* Month Header */}
                        <div className="sticky z-30 top-0 bg-default-50 dark:bg-default-50 px-4 py-2 border-b border-default-100">
                          <span className="text-sm font-bold text-primary dark:text-primary-500">
                            {monthFullNames[month] || month}{" "}
                            {getYearForMonth(month)}
                          </span>
                        </div>
                        {/* Records for this month */}
                        {groupedByMonth[month].map((record, idx) => (
                          <div
                            key={`${month}-${idx}`}
                            className="flex items-center justify-between p-4 hover:bg-default-50 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">
                                {record.date}
                              </span>
                            </div>
                            {renderAttendanceValue(record.value)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-default-400 gap-2">
                    <HelpCircle size={32} />
                    <p className="text-sm">No records found</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const CalendarDaysIcon = () => (
  <svg
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);
