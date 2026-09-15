import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardHeader, Progress, Button } from "@heroui/react";
import { HelpCircle, RefreshCw } from "lucide-react";

import { AppNavbar } from "@/components/app-navbar";
import { Footer } from "@/components/footer";
import { useAppContext } from "@/context/app-context";
import { calculateClassesNeeded } from "@/utils/attendance-utils";
import { RefreshModal } from "@/components/refresh-modal";

export const SubjectDetailPage = () => {
  const { subjectCode } = useParams<{ subjectCode: string }>();
  const navigate = useNavigate();
  const { attendance, setAttendance } = useAppContext();
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);

  if (!attendance || !subjectCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-black px-6">
        <Card className="p-8 rounded-[18px] border border-[#e0e0e0] dark:border-[#2a2a2c] bg-white dark:bg-[#272729] shadow-none">
          <CardBody className="items-center text-center">
            <p className="text-[21px] font-semibold text-[#1d1d1f] dark:text-white mb-2">
              No data available
            </p>
            <p className="text-[15px] text-[#333333] dark:text-[#cccccc] mb-4">
              Please open the app again to view attendance.
            </p>
            <Button
              className="apple-press rounded-full bg-[#0066cc] text-white"
              onPress={() => window.location.reload()}
            >
              Reload
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const subject = attendance.subjects.find((s) => s.code === subjectCode);

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-black px-6">
        <Card className="p-8 rounded-[18px] border border-[#e0e0e0] dark:border-[#2a2a2c] bg-white dark:bg-[#272729] shadow-none">
          <CardBody className="items-center text-center">
            <p className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-4">
              Subject not found
            </p>
            <Button
              className="apple-press rounded-full bg-[#0066cc] text-white"
              onPress={() => navigate("/")}
            >
              Go Back
            </Button>
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

  // Month abbreviation to number mapping
  const monthToNumber: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  // Helper to get day of week from date and month
  const getDayOfWeek = (dateStr: string, month: string): string => {
    // Date format is "Month-Day" (e.g., "Feb-05")
    const parts = dateStr.split("-");
    const dayNum = parseInt(parts[1] || parts[0]);
    const year = getYearForMonth(month);
    const monthNum = monthToNumber[month];
    const date = new Date(year, monthNum, dayNum);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return days[date.getDay()];
  };

  const renderAttendanceValue = (val: string) => {
    if (val === "1")
      return (
        <span className="text-[14px] font-semibold text-[#1a7f37] dark:text-[#7ee787]">
          Present
        </span>
      );
    if (val === "0")
      return (
        <span className="text-[14px] font-semibold text-[#c8102e] dark:text-[#ff6961]">
          Absent
        </span>
      );
    if (val.includes("+")) {
      if (val == "1+1") {
        return (
          <span className="text-[14px] font-semibold text-[#1a7f37] dark:text-[#7ee787]">
            Present {val}
          </span>
        );
      } else if (val == "0+0") {
        return (
          <span className="text-[14px] font-semibold text-[#c8102e] dark:text-[#ff6961]">
            Absent {val}
          </span>
        );
      }

      return (
        <span className="text-[14px] font-semibold text-[#9a6700] dark:text-[#d29922]">
          Extra {val}
        </span>
      );
    }

    return (
      <span className="text-[14px] text-[#333333] dark:text-[#cccccc]">
        {val}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-black">
      <AppNavbar />

      <div className="flex-grow w-full max-w-[980px] mx-auto px-5 sm:px-6 pt-6 pb-6 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            className="apple-press text-[17px] text-[#0066cc] dark:text-[#2997ff]"
            onClick={() => navigate("/")}
          >
            ‹ Back
          </button>
          <button
            aria-label="Refresh attendance"
            className="apple-press w-11 h-11 rounded-full bg-[#e8e8ed]/70 dark:bg-[#2a2a2c] flex items-center justify-center"
            onClick={() => setIsRefreshModalOpen(true)}
          >
            <RefreshCw className="text-[#1d1d1f] dark:text-white" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-[18px] border border-[#e0e0e0] dark:border-[#2a2a2c] bg-white dark:bg-[#272729] shadow-none">
              <CardHeader className="px-6 pt-6 pb-4 flex flex-col items-start gap-1">
                <div className="flex justify-between w-full items-start gap-4">
                  <div className="min-w-0">
                    <h1 className="text-[28px] leading-[1.14] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-white">
                      {subject.name}
                    </h1>
                    <p className="text-[14px] text-[#7a7a7a] dark:text-[#86868b] mt-1">
                      {subject.code}
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[40px] leading-none font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white">
                      {pctStr}
                    </span>
                    <span className="text-[12px] text-[#7a7a7a] dark:text-[#86868b] mt-1">
                      Total
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2">
                <div className="mb-6">
                  <div className="flex justify-between text-[14px] mb-2 text-[#333333] dark:text-[#cccccc]">
                    <span>Attendance progress</span>
                    <span>
                      {present} / {total} classes
                    </span>
                  </div>
                  <Progress
                    classNames={{
                      base: "h-[6px]",
                      track: "bg-[#e8e8ed] dark:bg-[#2a2a2c]",
                      indicator: "bg-[#0066cc]",
                    }}
                    showValueLabel={false}
                    value={pct}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col items-center py-3 border-r border-[#e0e0e0] dark:border-[#2a2a2c]">
                    <span className="text-[28px] leading-none font-semibold text-[#1d1d1f] dark:text-white">
                      {total}
                    </span>
                    <span className="text-[12px] text-[#7a7a7a] dark:text-[#86868b] mt-1">
                      Total
                    </span>
                  </div>
                  <div className="flex flex-col items-center py-3 border-r border-[#e0e0e0] dark:border-[#2a2a2c]">
                    <span className="text-[28px] leading-none font-semibold text-[#1d1d1f] dark:text-white">
                      {present}
                    </span>
                    <span className="text-[12px] text-[#7a7a7a] dark:text-[#86868b] mt-1">
                      Present
                    </span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-[28px] leading-none font-semibold text-[#1d1d1f] dark:text-white">
                      {absent}
                    </span>
                    <span className="text-[12px] text-[#7a7a7a] dark:text-[#86868b] mt-1">
                      Absent
                    </span>
                  </div>
                </div>

                {total > 0 && (
                  <p
                    className={`text-[15px] leading-[1.47] ${
                      calc.type === "skip"
                        ? "text-[#1a7f37] dark:text-[#7ee787]"
                        : "text-[#c8102e] dark:text-[#ff6961]"
                    }`}
                  >
                    {calc.type === "skip"
                      ? calc.count > 0
                        ? `You can skip the next ${calc.count} class${calc.count !== 1 ? "es" : ""} and stay above 75%.`
                        : `You are exactly on the edge. Attend the next class.`
                      : `Attend ${calc.count} more class${calc.count !== 1 ? "es" : ""} in a row to reach 75%.`}
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right Column: History */}
          <div>
            <Card className="rounded-[18px] border border-[#e0e0e0] dark:border-[#2a2a2c] bg-white dark:bg-[#272729] shadow-none h-full max-h-[600px] flex flex-col overflow-hidden">
              <CardHeader className="border-b border-[#e0e0e0] dark:border-[#2a2a2c] py-4 px-5">
                <h3 className="font-semibold text-[17px] text-[#1d1d1f] dark:text-white">
                  Daily history
                </h3>
              </CardHeader>
              <CardBody className="p-0 overflow-y-auto thin-scroll">
                {dailyRecords.length > 0 ? (
                  <div className="divide-y divide-[#f0f0f0] dark:divide-[#2a2a2c]">
                    {monthOrder.map((month) => (
                      <div key={month}>
                        {/* Month Header */}
                        <div className="sticky z-30 top-0 bg-white dark:bg-[#272729] px-5 py-2 border-b border-[#f0f0f0] dark:border-[#2a2a2c]">
                          <span className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">
                            {monthFullNames[month] || month}{" "}
                            {getYearForMonth(month)}
                          </span>
                        </div>
                        {/* Records for this month */}
                        {groupedByMonth[month].map((record, idx) => (
                          <div
                            key={`${month}-${idx}`}
                            className="flex items-center justify-between px-5 py-3"
                          >
                            <div className="flex flex-col">
                              <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">
                                {record.date}
                              </span>
                              <span className="text-[12px] text-[#7a7a7a] dark:text-[#86868b]">
                                {getDayOfWeek(record.date, record.month)}
                              </span>
                            </div>
                            {renderAttendanceValue(record.value)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-[#7a7a7a] gap-2">
                    <HelpCircle size={28} />
                    <p className="text-[14px]">No records found</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
      <Footer />

      <RefreshModal
        isOpen={isRefreshModalOpen}
        onClose={() => setIsRefreshModalOpen(false)}
        onRefresh={(data) => setAttendance(data)}
      />
    </div>
  );
};
