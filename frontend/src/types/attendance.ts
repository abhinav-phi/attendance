export interface InitResponse {
  sessionId: string;
  captchaSrc: string;
}

export interface Subject {
  code: string;
  name: string;
}

export interface DailyRecord {
  date: string;
  records: Record<string, string>;
}

export interface AttendanceData {
  studentInfo: {
    name: string;
    rollNo: string;
    semester: string;
    year: string;
  };
  subjects: Subject[];
  dailyAttendance: DailyRecord[];
  summary: {
    totalClasses: Record<string, string>;
    totalAbsent: Record<string, string>;
    totalPresent: Record<string, string>;
    overallClasses: Record<string, string>;
    overallAbsent: Record<string, string>;
    overallPresent: Record<string, string>;
    overallPercentage: Record<string, string>;
  };
  overallStats: {
    totalClasses: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: string;
  };
  legend: Record<string, string>;
}

export interface LoginResponse {
  success: boolean;
  attendance?: AttendanceData;
  message?: string;
  error?: string;
}
