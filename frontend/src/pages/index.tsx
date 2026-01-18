import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";

import DefaultLayout from "@/layouts/default";
import axiosClient from "@/api/axiosClient";

interface AttendanceData {
  studentInfo: {
    name?: string;
    rollNo?: string;
  };
  subjects: string[];
  attendance: Array<{
    date: string;
    values: string[];
  }>;
  summary: Record<string, string[]>;
}

export default function IndexPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [captchaSrc, setCaptchaSrc] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  // Initialize session and get captcha
  const initSession = async () => {
    setInitLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get("/init");

      if (data.error) throw new Error(data.error);
      setSessionId(data.sessionId);
      setCaptchaSrc(data.captchaSrc);
    } catch (e: any) {
      setError(
        "Failed to initialize: " + (e.response?.data?.error || e.message),
      );
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: loginData } = await axiosClient.post("/login", {
        sessionId,
        username,
        password,
        captcha,
      });

      if (loginData.error) {
        throw new Error(loginData.error || "Login failed");
      }

      setLoggedIn(true);

      // Check if attendance came with login response
      if (loginData.attendance) {
        setAttendance(loginData.attendance);
      } else {
        // Fetch attendance separately
        const { data: attData } = await axiosClient.post("/attendance", {
          sessionId,
        });

        if (attData.success && attData.data) {
          setAttendance(attData.data);
        }
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
      // Refresh captcha on error
      initSession();
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (
    pct: string,
  ): "success" | "warning" | "danger" | "default" => {
    const num = parseFloat(pct);

    if (isNaN(num)) return "default";
    if (num >= 75) return "success";
    if (num >= 50) return "warning";

    return "danger";
  };

  if (initLoading) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-default-500">Connecting to NSUT portal...</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10">
        <h1 className="text-3xl font-bold text-center">
          NSUT Attendance Portal
        </h1>

        {!loggedIn ? (
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Student Login</h2>
              <p className="text-small text-default-500">
                Enter your NSUT portal credentials
              </p>
            </CardHeader>
            <CardBody>
              <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                <Input
                  isRequired
                  label="Roll Number"
                  placeholder="e.g., 2024UCS1695"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  isRequired
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex flex-col gap-2">
                  <p className="text-small text-default-500">Security Code</p>
                  <div className="flex items-center gap-3">
                    {captchaSrc ? (
                      <img
                        alt="Captcha"
                        className="border rounded-lg"
                        src={captchaSrc}
                      />
                    ) : (
                      <div className="w-24 h-10 bg-default-100 rounded-lg flex items-center justify-center">
                        <Spinner size="sm" />
                      </div>
                    )}
                    <Button
                      isDisabled={loading}
                      size="sm"
                      variant="flat"
                      onClick={initSession}
                    >
                      Refresh
                    </Button>
                  </div>
                  <Input
                    isRequired
                    placeholder="Enter captcha"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-danger text-sm">{error}</p>
                  </div>
                )}

                <Button
                  className="mt-2"
                  color="primary"
                  isLoading={loading}
                  type="submit"
                >
                  {loading ? "Logging in..." : "View Attendance"}
                </Button>
              </form>
            </CardBody>
          </Card>
        ) : (
          <div className="w-full max-w-4xl">
            {attendance && (
              <>
                {/* Student Info */}
                <Card className="mb-6">
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {attendance.studentInfo?.name || "Student"}
                        </h2>
                        <p className="text-default-500">
                          Roll No: {attendance.studentInfo?.rollNo || username}
                        </p>
                      </div>
                      <Button
                        color="danger"
                        variant="flat"
                        onClick={() => {
                          setLoggedIn(false);
                          setAttendance(null);
                          setCaptcha("");
                          initSession();
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                {/* Attendance Summary */}
                {attendance.summary &&
                  Object.keys(attendance.summary).length > 0 && (
                    <Card className="mb-6">
                      <CardHeader>
                        <h3 className="text-xl font-semibold">
                          Attendance Summary
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {attendance.subjects?.map((subjectCode, idx) => {
                            const percentageRow = Object.entries(
                              attendance.summary,
                            ).find(
                              ([key]) =>
                                key.toLowerCase().includes("percentage") ||
                                key.toLowerCase().includes("overall"),
                            );
                            const percentage =
                              percentageRow?.[1]?.[idx] || "N/A";

                            return (
                              <Card key={subjectCode} className="bg-default-50">
                                <CardBody>
                                  <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                      <span className="font-mono text-sm text-default-500">
                                        {subjectCode}
                                      </span>
                                      <Chip
                                        color={getPercentageColor(percentage)}
                                        size="lg"
                                        variant="flat"
                                      >
                                        {percentage}%
                                      </Chip>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>
                      </CardBody>
                    </Card>
                  )}

                {/* Daily Attendance Table */}
                {attendance.attendance && attendance.attendance.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-xl font-semibold">
                        Daily Attendance
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-default-100">
                              <th className="p-2 text-left">Date</th>
                              {attendance.subjects?.map((sub) => (
                                <th key={sub} className="p-2 text-center">
                                  {sub}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.attendance.map((day, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-default-100"
                              >
                                <td className="p-2 font-medium">{day.date}</td>
                                {day.values?.map((val, i) => (
                                  <td key={i} className="p-2 text-center">
                                    {val === "1" || val === "P" ? (
                                      <span className="text-success font-bold">
                                        ✓
                                      </span>
                                    ) : val === "0" || val === "A" ? (
                                      <span className="text-danger font-bold">
                                        ✗
                                      </span>
                                    ) : val && val !== "-" ? (
                                      <span className="text-warning">
                                        {val}
                                      </span>
                                    ) : (
                                      <span className="text-default-300">
                                        -
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Summary rows */}
                {attendance.summary &&
                  Object.keys(attendance.summary).length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Statistics</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-default-100">
                                <th className="p-2 text-left">Metric</th>
                                {attendance.subjects?.map((sub) => (
                                  <th key={sub} className="p-2 text-center">
                                    {sub}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(attendance.summary).map(
                                ([label, values]) => (
                                  <tr
                                    key={label}
                                    className="border-b border-default-100"
                                  >
                                    <td className="p-2 font-medium">{label}</td>
                                    {values?.map((val, i) => (
                                      <td key={i} className="p-2 text-center">
                                        {val || "-"}
                                      </td>
                                    ))}
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardBody>
                    </Card>
                  )}
              </>
            )}

            {!attendance && (
              <Card>
                <CardBody className="text-center py-10">
                  <Spinner size="lg" />
                  <p className="mt-4 text-default-500">Loading attendance...</p>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
