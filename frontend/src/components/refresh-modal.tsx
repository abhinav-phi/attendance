import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { RefreshCw } from "lucide-react";

import {
  InitResponse,
  LoginResponse,
  AttendanceData,
} from "@/types/attendance";
import axiosClient from "@/api/axiosClient";

interface RefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: (data: AttendanceData) => void;
}

export const RefreshModal = ({
  isOpen,
  onClose,
  onRefresh,
}: RefreshModalProps) => {
  const [loading, setLoading] = useState(false);
  const [initData, setInitData] = useState<InitResponse | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState("");

  const initSession = async () => {
    setLoading(true);
    setError("");
    setCaptcha("");
    try {
      const res = await axiosClient.get<InitResponse>("/init");

      setInitData(res.data);
    } catch {
      setError("Failed to load captcha. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initSession();
    }
  }, [isOpen]);

  const handleRefresh = async () => {
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
        onRefresh(res.data.attendance);
        onClose();
        setCaptcha("");
      } else if (res.data.error) {
        setError(res.data.error);
        initSession();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Refresh failed. Please try again.";

      setError(errorMsg);
      initSession();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCaptcha("");
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      onClose={handleClose}
      classNames={{
        base: "rounded-[18px] bg-white dark:bg-[#272729] shadow-none border border-[#e0e0e0] dark:border-[#2a2a2c]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 px-6 pt-6">
          <h3 className="text-[21px] font-semibold tracking-[0.01em] text-[#1d1d1f] dark:text-white">
            Refresh attendance
          </h3>
          <p className="text-[14px] font-normal text-[#7a7a7a] dark:text-[#86868b]">
            Enter the captcha to fetch the latest data
          </p>
        </ModalHeader>
        <ModalBody className="px-6">
          {error && (
            <p className="text-[14px] text-[#c8102e] dark:text-[#ff6961] text-center">
              {error}
            </p>
          )}

          {initData?.captchaSrc && (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  alt="Captcha"
                  className="h-11 w-auto border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-[8px] bg-white object-contain px-2"
                  src={initData.captchaSrc}
                />
                <button
                  aria-label="Reload captcha"
                  className="apple-press absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#e8e8ed] dark:bg-black flex items-center justify-center"
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
                    handleRefresh();
                  }
                }}
              />
            </div>
          )}

          {!initData?.captchaSrc && !error && (
            <div className="flex items-center justify-center py-4 gap-2">
              <RefreshCw className="animate-spin text-[#0066cc]" size={18} />
              <span className="text-[14px] text-[#7a7a7a]">
                Loading captcha…
              </span>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="px-6 pb-6">
          <Button
            className="apple-press rounded-full text-[#0066cc] dark:text-[#2997ff] text-[17px]"
            variant="light"
            onPress={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="apple-press rounded-full bg-[#0066cc] text-white text-[17px] font-normal"
            isDisabled={loading || !captcha}
            isLoading={loading}
            onPress={handleRefresh}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
