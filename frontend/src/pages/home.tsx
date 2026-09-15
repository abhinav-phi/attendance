import { useState } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";

import { useAppContext } from "@/context/app-context";
import { AppNavbar } from "@/components/app-navbar";
import { SubjectCard } from "@/components/subject-card";
import { timeAgo } from "@/utils/cache";
import { Footer } from "@/components/footer";
import { RefreshModal } from "@/components/refresh-modal";

export const HomePage = () => {
  const { attendance, setAttendance, lastUpdated } = useAppContext();
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);

  if (!attendance) return null;

  const subjects = attendance.subjects || [];
  const summary = attendance.summary || {};
  const stats = attendance.overallStats;
  const pct = parseFloat(stats.percentage);
  const atRisk = !isNaN(pct) && pct < 75;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-black">
      <AppNavbar username={attendance.studentInfo?.name.split(" ")[0]} />

      <main className="flex-grow w-full max-w-[980px] mx-auto px-5 sm:px-6 pt-10 pb-6">
        <div className="flex flex-col gap-8">
          {/* Hero */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[34px] sm:text-[40px] leading-[1.1] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white">
              {greeting},{" "}
              {attendance.studentInfo?.name.split(" ")[0] || "there"}.
            </h1>
            <p className="text-[17px] text-[#333333] dark:text-[#cccccc]">
              Here&apos;s your attendance at a glance.
            </p>
          </div>

          {/* Overall */}
          <Card className="rounded-[18px] border border-[#e0e0e0] dark:border-[#2a2a2c] bg-white dark:bg-[#272729] shadow-none">
            <CardBody className="p-6 flex flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[14px] text-[#7a7a7a] dark:text-[#86868b]">
                  Overall attendance
                </p>
                <p className="mt-1 text-[56px] leading-[1.07] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white">
                  {stats.percentage}
                </p>
                <p className="mt-1 text-[14px] text-[#333333] dark:text-[#cccccc]">
                  {stats.totalPresent} of {stats.totalClasses} classes
                  {atRisk ? (
                    <span className="text-[#c8102e] dark:text-[#ff6961]">
                      {" "}
                      · below 75%
                    </span>
                  ) : (
                    <span className="text-[#1a7f37] dark:text-[#7ee787]">
                      {" "}
                      · on track
                    </span>
                  )}
                </p>
                {lastUpdated && (
                  <p className="mt-2 text-[12px] text-[#7a7a7a] dark:text-[#86868b]">
                    Updated {timeAgo(lastUpdated)}
                  </p>
                )}
              </div>
              <Button
                className="apple-press shrink-0 h-11 px-[22px] rounded-full bg-[#0066cc] text-white text-[17px] font-normal"
                startContent={<RefreshCw size={16} />}
                onPress={() => setIsRefreshModalOpen(true)}
              >
                Refresh
              </Button>
            </CardBody>
          </Card>

          {/* Subjects */}
          <div>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <h2 className="text-[21px] font-semibold tracking-[0.01em] text-[#1d1d1f] dark:text-white">
                Subjects
              </h2>
              <p className="text-[14px] text-[#7a7a7a] dark:text-[#86868b]">
                {subjects.length} total
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {subjects.map((subject, idx) => (
                <SubjectCard
                  key={subject.code}
                  index={idx}
                  subject={subject}
                  summary={summary}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <RefreshModal
        isOpen={isRefreshModalOpen}
        onClose={() => setIsRefreshModalOpen(false)}
        onRefresh={(data) => setAttendance(data)}
      />
    </div>
  );
};
