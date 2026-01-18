import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import { AppContext } from "@/context/app-context";
import { AttendanceData } from "@/types/attendance";
import { LoginPage } from "@/pages/login";
import { HomePage } from "@/pages/home";
import { SubjectDetailPage } from "@/pages/subject-detail";

export default function App() {
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [username, setUsername] = useState("");

  const handleLogin = (data: AttendanceData, user: string) => {
    setAttendance(data);
    setUsername(user);
  };

  if (!attendance) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppContext.Provider value={{ attendance, setAttendance, username }}>
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
