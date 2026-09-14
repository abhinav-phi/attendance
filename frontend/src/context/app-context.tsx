import { createContext, useContext } from "react";

import { AttendanceData } from "@/types/attendance";

interface AppContextType {
  attendance: AttendanceData | null;
  setAttendance: (data: AttendanceData | null) => void;
  username: string;
  lastUpdated: number | null;
}

export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context)
    throw new Error("useAppContext must be used within AppProvider");

  return context;
};
