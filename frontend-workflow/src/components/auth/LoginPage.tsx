/**
 * Login page component.
 *
 * Tab-based login with email/password and phone OTP options.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { Mail, Lock, AlertCircle, Loader2, ArrowRight, Sparkles, FileText, Presentation, Palette, Phone, CheckCircle2 } from "lucide-react";

type LoginMethod = "email" | "phone";

interface Props {
  onSwitchToRegister: () => void;
  footer?: React.ReactNode;
}

export function LoginPage({ onSwitchToRegister, footer }: Props) {
  const { t } = useTranslation('login');
  
  // Tab state
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone");
  
  // Email login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone login
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsStep, setSmsStep] = useState<"idle" | "sent">("idle");
  const [smsSent, setSmsSent] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  
  // 动态文字索引
  const [featureIndex, setFeatureIndex] = useState(0);

  const features = [
    {
      icon: Sparkles,
      title: t('features.paper2figure.title'),
      desc: t('features.paper2figure.desc'),
      color: "text-neon-cyan",
      bg: "bg-neon-cyan/10",
      border: "border-neon-cyan/30"
    },
    {
      icon: FileText,
      title: t('features.paper2ppt.title'),
      desc: t('features.paper2ppt.desc'),
      color: "text-neon-purple",
      bg: "bg-neon-purple/10",
      border: "border-neon-purple/30"
    },
    {
      icon: Presentation,
      title: t('features.pdf2ppt.title'),
      desc: t('features.pdf2ppt.desc'),
      color: "text-neon-pink",
      bg: "bg-neon-pink/10",
      border: "border-neon-pink/30"
    },
    {
      icon: Palette,
      title: t('features.pptPolish.title'),
      desc: t('features.pptPolish.desc'),
      color: "text-neon-cyan",
      bg: "bg-neon-cyan/10",
      border: "border-neon-cyan/30"
    }
  ];

  // 自动轮播功能
  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const {
    signInWithEmail,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    loading,
    error,
    clearError,
  } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await signInWithEmail(email, password);
  };

  const handleSendSms = async () => {
    clearError();
    setSmsSent(false);
    setSendingSms(true);
    const success = await signInWithPhoneOtp(phone);
    setSendingSms(false);
    if (success) {
      setSmsStep("sent");
      setSmsSent(true);
    }
  };

  const handleVerifySms = async () => {
    clearError();
    await verifyPhoneOtp(phone, smsCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base p-4 relative overflow-hidden">
      {/* 动态背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* 左侧：功能展示区 */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8">
          <div>
            <h1 className="text-5xl font-display font-bold text-lab-primary mb-4 leading-tight">
              {t('heroTitlePrefix')} <span className="text-neon-cyan">Any</span>
            </h1>
            <p className="text-lab-secondary text-lg max-w-md">
              {t('heroDesc')}
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={`transform transition-all duration-500 border rounded-xl p-4 flex items-center gap-4 ${
                  idx === featureIndex 
                    ? `scale-105 ${feature.bg} ${feature.border} shadow-[0_0_20px_rgba(34,211,238,0.15)] translate-x-4`
                    : 'border-slate-200 bg-white/70 opacity-80 hover:opacity-100 hover:translate-x-2'
                }`}
                onClick={() => setFeatureIndex(idx)}
              >
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <feature.icon className={feature.color} size={24} />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-lg ${idx === featureIndex ? 'text-lab-primary' : 'text-slate-700'}`}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-lab-secondary">{feature.desc}</p>
                </div>
                {idx === featureIndex && (
                  <div className="ml-auto">
                    <ArrowRight className="text-neon-cyan animate-bounce-x" size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：登录表单 */}
        <div className="bento-card scan-line p-8 md:p-10 w-full">
          <div className="lg:hidden mb-8 text-center">
             <h2 className="text-3xl font-display font-bold text-lab-primary mb-2">{t('title')}</h2>
             <p className="text-lab-secondary text-sm">{t('subtitle')}</p>
          </div>

          <h2 className="text-2xl font-display font-bold text-lab-primary mb-2">{t('welcome')}</h2>
          <p className="text-lab-secondary mb-6 text-sm">{t('loginSubtitle')}</p>

          {error && (
            <div className="status-error mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          {/* Tab 切换 */}
          <div className="auth-method-switch mb-6" role="group" aria-label={t('loginMethodLabel')}>
            <button
              type="button"
              onClick={() => setLoginMethod("phone")}
              className={`neon-tab ${loginMethod === "phone" ? "neon-tab-active" : ""}`}
              aria-pressed={loginMethod === "phone"}
            >
              <Phone size={16} />
              <span>{t('phoneTab')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`neon-tab ${loginMethod === "email" ? "neon-tab-active" : ""}`}
              aria-pressed={loginMethod === "email"}
            >
              <Mail size={16} />
              <span>{t('emailTab')}</span>
            </button>
          </div>

          {/* 手机号登录表单 */}
          {loginMethod === "phone" && (
            <div className="space-y-4">
              {/* 第一行：手机号 + 发送按钮 */}
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="login-phone" className="block text-xs font-medium text-lab-secondary ml-1">{t('phoneLabel')}</label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
                      <Phone className="text-slate-500 group-focus-within:text-neon-cyan transition-colors" size={18} />
                    </div>
                    <input
                      id="login-phone"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="neon-input neon-input-with-icon"
                      placeholder={t('phonePlaceholder')}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-transparent ml-1" aria-hidden="true">-</span>
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={sendingSms || !phone.trim()}
                    className="btn-neon px-6 py-2.5 disabled:opacity-40 whitespace-nowrap flex items-center justify-center gap-2 min-w-[120px]"
                  >
                    {sendingSms ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>{t('sendingCode')}</span>
                      </>
                    ) : smsStep === "sent" ? (
                      <span>{t('resendCode')}</span>
                    ) : (
                      <span>{t('sendCode')}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* 发送成功提示 */}
              {smsSent && (
                <div className="status-success flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{t('codeSent')}</span>
                </div>
              )}

              {/* 第二行：验证码输入框 */}
              <div className="space-y-1.5">
                <label htmlFor="login-sms-code" className="block text-xs font-medium text-lab-secondary ml-1">{t('codeLabel')}</label>
                <input
                  id="login-sms-code"
                  type="text"
                  inputMode="numeric"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="neon-input w-full tracking-widest text-center text-lg"
                  placeholder={t('codePlaceholder')}
                  disabled={sendingSms || loading || smsStep === "idle"}
                  maxLength={6}
                />
              </div>

              {/* 登录按钮 */}
              <button
                type="button"
                onClick={handleVerifySms}
                disabled={loading || smsCode.trim().length < 4 || smsStep === "idle"}
                className="btn-neon glow w-full py-3.5 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading && smsStep === "sent" ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{t('loggingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('loginButton')}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* 邮箱登录表单 */}
          {loginMethod === "email" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-medium text-lab-secondary ml-1">{t('emailLabel')}</label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
                    <Mail className="text-slate-500 group-focus-within:text-neon-cyan transition-colors" size={18} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neon-input neon-input-with-icon"
                    placeholder={t('emailPlaceholder')}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-lab-secondary ml-1">{t('passwordLabel')}</label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
                    <Lock className="text-slate-500 group-focus-within:text-neon-cyan transition-colors" size={18} />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="neon-input neon-input-with-icon"
                    placeholder={t('passwordPlaceholder')}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon glow w-full py-3.5 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{t('loggingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('loginButton')}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-lab-secondary text-sm">
              {t('noAccount')}{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-neon-cyan hover:text-neon-cyan/80 font-medium hover:underline transition-colors"
              >
                {t('registerLink')}
              </button>
            </p>
          </div>

          {footer}
        </div>
      </div>

      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(25%); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
}
