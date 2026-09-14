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
    <Modal isOpen={isOpen} placement="center" onClose={handleClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Refresh Attendance</h3>
          <p className="text-sm text-default-500 font-normal">
            Enter the captcha to fetch latest attendance data
          </p>
        </ModalHeader>
        <ModalBody>
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-600 p-3 rounded-lg text-sm font-medium text-center">
              {error}
            </div>
          )}

          {initData?.captchaSrc && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    alt="Captcha"
                    className="h-12 w-auto border border-default-300 rounded-lg bg-white object-contain px-2"
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
                  placeholder="Enter captcha code"
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
            </div>
          )}

          {!initData?.captchaSrc && !error && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="animate-spin text-primary" size={24} />
              <span className="ml-2 text-default-500">Loading captcha...</span>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isDisabled={loading || !captcha}
            isLoading={loading}
            onPress={handleRefresh}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
