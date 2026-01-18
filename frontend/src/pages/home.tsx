import { Card, CardBody, Chip } from "@heroui/react";
import { motion } from "framer-motion";
import { CalendarDays, BarChart3, Clock } from "lucide-react";

import { useAppContext } from "@/context/app-context";
import { AppNavbar } from "@/components/app-navbar";
import { SubjectCard } from "@/components/subject-card";
import { getPercentageColor } from "@/utils/attendance-utils";
import { Footer } from "@/components/footer";

export const HomePage = () => {
  const { attendance, username } = useAppContext();

  if (!attendance) return null;

  const subjects = attendance.subjects || [];
  const summary = attendance.summary || {};
  const stats = attendance.overallStats;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-black">
      <AppNavbar
        showLogout
        username={attendance.studentInfo?.name.split(" ")[0]}
      />

      {/* Decorative background */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/10 pointer-events-none" />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 relative z-10 pb-10">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {greeting},{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  {attendance.studentInfo?.name.split(" ")[0]}
                </span>
              </h1>
              <p className="text-default-500 mt-2 text-lg">
                Overall Attendance Status
              </p>
            </div>

            <div className="flex gap-4">
              <Card className="border-none shadow-sm bg-white/60 dark:bg-default-100/50 backdrop-blur-md">
                <CardBody className="py-2 px-4 flex-row items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${getPercentageColor(parseFloat(stats.percentage)) === "success" ? "bg-success-100 text-success-600 dark:text-success-400 dark:bg-success-900/20" : "bg-warning-100 text-warning-600 dark:text-warning-400 dark:bg-warning-900/20"}`}
                  >
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-default-400 font-semibold uppercase">
                      Total
                    </p>
                    <p
                      className={`text-xl font-bold ${getPercentageColor(parseFloat(stats.percentage)) === "success" ? "text-success-600 dark:text-success-400" : getPercentageColor(parseFloat(stats.percentage)) === "warning" ? "text-warning-600 dark:text-warning-400" : "text-danger-600 dark:text-danger-400"}`}
                    >
                      {stats.percentage}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </motion.div>

          {/* Overview Stats Grid */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-white dark:bg-default-50 shadow-sm">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-default-500 text-xs font-semibold uppercase">
                    Student Info
                  </p>
                  <p className="text-sm font-bold mt-1 max-w-[120px] truncate">
                    {attendance.studentInfo?.rollNo || username}
                  </p>
                  <p className="text-xs text-default-400">
                    Sem {attendance.studentInfo?.semester}
                  </p>
                </div>
                <div className="p-2 bg-default-100 rounded-lg text-default-500">
                  <UserIcon />
                </div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-default-50 shadow-sm">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-default-500 text-xs font-semibold uppercase">
                    Total Classes
                  </p>
                  <p className="text-xl font-bold mt-1 text-foreground">
                    {stats.totalClasses}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                  <CalendarDays size={20} />
                </div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-default-50 shadow-sm">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-default-500 text-xs font-semibold uppercase">
                    Present
                  </p>
                  <p className="text-xl font-bold mt-1 text-success-600 dark:text-success-400">
                    {stats.totalPresent}
                  </p>
                </div>
                <div className="p-2 bg-success-50 dark:bg-success-900/20 text-success-500 dark:text-success-400 rounded-lg">
                  <Clock size={20} />
                </div>
              </CardBody>
            </Card>
            <Card className="bg-white dark:bg-default-50 shadow-sm">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-default-500 text-xs font-semibold uppercase">
                    Absent
                  </p>
                  <p className="text-xl font-bold mt-1 text-danger-600 dark:text-danger-400">
                    {stats.totalAbsent}
                  </p>
                </div>
                <div className="p-2 bg-danger-50 dark:bg-danger-900/20 text-danger-500 dark:text-danger-400 rounded-lg">
                  <Clock size={20} />
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Subjects Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-default-700 dark:text-default-300 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                My Subjects
              </h2>
              <Chip color="primary" size="sm" variant="flat">
                {subjects.length} Subjects
              </Chip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

const UserIcon = () => (
  <svg
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
