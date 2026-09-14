import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";
import { RefreshCw, LogIn } from "lucide-react";
import { motion } from "framer-motion";

import { InitResponse, LoginResponse, AttendanceData } from "@/types/attendance";
import { AppNavbar } from "@/components/app-navbar";
import { Footer } from "@/components/footer";
import axiosClient from "@/api/axiosClient";

interface LoginPageProps {
  onLogin: (data: AttendanceData) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [loading, setLoading] = useState(false);
  const [initData, setInitData] = useState<InitResponse | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState("");

  const initSession = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get<InitResponse>("/init");

      setInitData(res.data);
    } catch (err) {
      console.error(err);
      setError("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const handleLogin = async () => {
    if (!initData || !captcha) return;
    setLoading(true);
    setError("");

    try {
      // Single-user: credentials live on the server, only captcha is needed
      const res = await axiosClient.post<LoginResponse>("/refresh", {
        sessionId: initData.sessionId,
        captcha,
      });

      if (res.data.success && res.data.attendance) {
        onLogin(res.data.attendance);
      } else if (res.data.error) {
        setError(res.data.error);
        initSession();
        setCaptcha("");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Failed. Check captcha and try again.";

      setError(errorMsg);
      initSession();
      setCaptcha("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#000000]">
      <AppNavbar />

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 z-10">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full shadow-2xl border border-default-100 bg-white/70 dark:bg-default-50/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col items-center pt-8 pb-2 gap-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-2">
                <span className="text-white font-bold text-3xl">p</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">present</h1>
              <p className="text-default-500 text-sm">
                Enter the captcha to view your attendance
              </p>
            </CardHeader>

            <CardBody className="px-8 pb-8 pt-4 flex flex-col gap-5">
              {error && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-danger-50 border border-danger-200 text-danger-600 p-3 rounded-lg text-sm font-medium text-center"
                  initial={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.div>
              )}

              {initData?.captchaSrc ? (
                <div className="space-y-2">
                  <p className="text-small font-medium text-default-700">
                    Captcha
                  </p>
                  <div className="flex gap-3">
                    <div className="relative group shrink-0">
                      <img
                        alt="Captcha"
                        className="h-12 w-auto border border-default-300 rounded-lg bg-white object-contain px-2 transition-all group-hover:border-primary"
                        src={initData.captchaSrc}
                      />
                      <Button
                        isIconOnly
                        className="absolute -top-2 -right-2 bg-default-100 shadow-sm border border-default-200"
                        isDisabled={loading}
                        radius="full"
                        size="sm"
                        onPress={initSession}
                      >
                        <RefreshCw
                          className={loading ? "animate-spin" : ""}
                          size={14}
                        />
                      </Button>
                    </div>
                    <Input
                      classNames={{
                        inputWrapper:
                          "h-12 bg-default-100/50 hover:bg-default-100 focus-within:bg-default-100 border-default-200",
                      }}
                      isDisabled={loading}
                      placeholder="Enter code"
                      value={captcha}
                      variant="bordered"
                      onChange={(e) => setCaptcha(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && captcha) {
                          handleLogin();
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                !error && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw
                      className="animate-spin text-primary"
                      size={24}
                    />
                    <span className="ml-2 text-default-500">
                      Loading captcha...
                    </span>
                  </div>
                )
              )}

              <Button
                className="mt-2 w-full font-semibold shadow-lg shadow-indigo-500/20"
                color="primary"
                isDisabled={loading || !captcha}
                isLoading={loading}
                size="lg"
                startContent={!loading && <LogIn size={18} />}
                onPress={handleLogin}
              >
                {loading ? "Fetching..." : "View Attendance"}
              </Button>
            </CardBody>
          </Card>

          <p className="text-center text-xs text-default-400 mt-6">
            Your attendance, one tap away
          </p>
        </motion.div>
      </div>

      <div className="z-10 pb-4">
        <Footer />
      </div>
    </div>
  );
};
