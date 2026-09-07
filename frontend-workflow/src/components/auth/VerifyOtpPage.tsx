/**
 * OTP Verification page component.
 *
 * Allows users to enter the 6-digit verification code sent to their email.
 */

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { Mail, AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface Props {
  email: string;
  onBack: () => void;
}

export function VerifyOtpPage({ email, onBack }: Props) {
  const [otpLength, setOtpLength] = useState(6);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { verifyOtp, resendOtp, loading, error, clearError } = useAuthStore();

  // Reset OTP array when length changes
  useEffect(() => {
    setOtp(Array(otpLength).fill(""));
    // Reset refs array
    inputRefs.current = inputRefs.current.slice(0, otpLength);
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }, [otpLength]);

  // Handle cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === otpLength - 1 && newOtp.every((d) => d !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    
    // Auto-detect length
    if (pasted.length === 8 && otpLength !== 8) {
      setOtpLength(8);
      // We need to wait for the effect to update state and refs
      setTimeout(() => {
        const newOtp = pasted.split("");
        setOtp(newOtp);
        handleSubmit(pasted);
      }, 50);
      return;
    }
    
    const relevantPasted = pasted.slice(0, otpLength);
    if (relevantPasted.length === otpLength) {
      const newOtp = relevantPasted.split("");
      setOtp(newOtp);
      handleSubmit(relevantPasted);
    }
  };

  const handleSubmit = async (code?: string) => {
    clearError();
    const otpCode = code || otp.join("");
    if (otpCode.length !== otpLength) return;

    await verifyOtp(email, otpCode);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    clearError();
    await resendOtp(email);
    setResendCooldown(60); // 60 second cooldown
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base p-4">
      <div className="bento-card scan-line p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-cyan/30 bg-neon-cyan/10">
            <Mail className="text-neon-cyan" size={32} />
          </div>
          <h2 className="text-2xl font-display font-bold text-lab-primary mb-2">
            Check your email
          </h2>
          <p className="text-lab-secondary text-sm">
            We sent a verification code to <strong className="text-lab-primary">{email}</strong>
          </p>
        </div>

        {error && (
          <div className="status-error mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* OTP Input */}
        <div className="flex justify-center gap-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading}
              className="w-10 h-14 sm:w-12 text-center text-xl sm:text-2xl font-display font-bold bg-white border border-border-medium rounded-lg text-lab-primary focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] disabled:opacity-50 transition-all"
            />
          ))}
        </div>

        {/* Length Toggle */}
        <div className="text-center mb-6">
          <button
            onClick={() => setOtpLength(otpLength === 6 ? 8 : 6)}
            className="text-xs text-slate-500 hover:text-neon-cyan transition-colors"
          >
            {otpLength === 6 ? "Use 8-digit code" : "Use 6-digit code"}
          </button>
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={loading || otp.some((d) => !d)}
          className="btn-neon glow w-full py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </button>

        {/* Resend button */}
        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="text-sm text-lab-secondary hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </div>

        {/* Back button */}
        <p className="mt-6 text-center text-lab-secondary text-sm">
          <button
            onClick={onBack}
            className="text-neon-cyan hover:text-neon-cyan/80 hover:underline transition-colors"
          >
            ← Back to login
          </button>
        </p>
      </div>
    </div>
  );
}
