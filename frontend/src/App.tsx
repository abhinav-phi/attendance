import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import { AppContext } from "@/context/app-context";
import { AttendanceData } from "@/types/attendance";
import { LoginPage } from "@/pages/login";
import { HomePage } from "@/pages/home";
import { SubjectDetailPage } from "@/pages/subject-detail";
import { loadCache, saveCache } from "@/utils/cache";

export default function App() {
  // Instant open: show last saved attendance immediately, no login wait
  const [attendance, setAttendance] = useState<AttendanceData | null>(
    () => loadCache().data,
  );
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    () => loadCache().updatedAt,
  );

  const handleFreshData = (data: AttendanceData | null) => {
    if (!data) return;
    const updatedAt = Date.now();

    saveCache(data, updatedAt);
    setAttendance(data);
    setLastUpdated(updatedAt);
  };

  if (!attendance) {
    return <LoginPage onLogin={handleFreshData} />;
  }

  return (
    <AppContext.Provider
      value={{
        attendance,
        setAttendance: handleFreshData,
        username: "",
        lastUpdated,
      }}
    >
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route
          element={<SubjectDetailPage />}
          path="/attendance/:subjectCode"
        />
      </Routes>
    </AppContext.Provider>
  );
}
