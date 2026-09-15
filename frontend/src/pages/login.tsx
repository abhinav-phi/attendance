import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";

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
      setError("Couldn't reach the server. Try again.");
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
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-black">
      <AppNavbar />

      <div className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <h1 className="text-[34px] leading-[1.12] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white text-center">
            present
          </h1>
          <p className="mt-2 text-[17px] text-[#333333] dark:text-[#cccccc] text-center">
            Your attendance, one tap away.
          </p>

          <Card className="w-full mt-8 rounded-[18px] border border-[#e0e0e0] dark:border-[#2a2a2c] bg-white dark:bg-[#272729] shadow-none">
            <CardHeader className="px-6 pt-6 pb-0">
              <p className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">
                Enter captcha to continue
              </p>
            </CardHeader>

            <CardBody className="px-6 py-6 flex flex-col gap-4">
              {error && (
                <p className="text-[14px] text-[#c8102e] dark:text-[#ff6961] text-center">
                  {error}
                </p>
              )}

              {initData?.captchaSrc ? (
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      alt="Captcha"
                      className="h-11 w-auto border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-[8px] bg-white object-contain px-2"
                      src={initData.captchaSrc}
                    />
                    <button
                      aria-label="Reload captcha"
                      className="apple-press absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#e8e8ed] dark:bg-[#2a2a2c] flex items-center justify-center"
                      disabled={loading}
                      onClick={initSession}
                    >
                      <RefreshCw
                        className={`text-[#1d1d1f] dark:text-white ${loading ? "animate-spin" : ""}`}
                        size={12}
                      />
                    </button>
                  </div>
                  <Input
                    aria-label="Captcha code"
                    classNames={{
                      inputWrapper:
                        "h-11 rounded-full bg-white dark:bg-black border border-[#e0e0e0] dark:border-[#2a2a2c] shadow-none",
                      input:
                        "text-[17px] text-[#1d1d1f] dark:text-white placeholder:text-[#7a7a7a]",
                    }}
                    isDisabled={loading}
                    placeholder="Captcha code"
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
              ) : (
                !error && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <RefreshCw
                      className="animate-spin text-[#0066cc]"
                      size={18}
                    />
                    <span className="text-[14px] text-[#7a7a7a]">
                      Loading captcha…
                    </span>
                  </div>
                )
              )}

              <Button
                className="apple-press w-full h-11 rounded-full bg-[#0066cc] text-white text-[17px] font-normal"
                isDisabled={loading || !captcha}
                isLoading={loading}
                onPress={handleLogin}
              >
                {loading ? "Fetching…" : "View Attendance"}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};
