/**
 * Registration page component.
 *
 * Email/password signup form with password confirmation.
 * After signup, redirects to OTP verification if email confirmation is required.
 */

import { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { Mail, Lock, AlertCircle, Loader2, ArrowRight, Sparkles, FileText, Presentation, Palette } from "lucide-react";

interface Props {
  onSwitchToLogin: () => void;
  footer?: React.ReactNode;
}

export function RegisterPage({ onSwitchToLogin, footer }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState("");
  const INVITE_CODE_STORAGE_KEY = "paper2any_invite_code";
  
  // 动态文字索引
  const [featureIndex, setFeatureIndex] = useState(0);

  const features = [
    {
      icon: Sparkles,
      title: "Paper2Figure",
      desc: "论文一键转科研绘图",
      color: "text-neon-cyan",
      bg: "bg-neon-cyan/10",
      border: "border-neon-cyan/30"
    },
    {
      icon: FileText,
      title: "Paper2PPT",
      desc: "论文内容智能生成 PPT，支持超级长PPT",
      color: "text-neon-purple",
      bg: "bg-neon-purple/10",
      border: "border-neon-purple/30"
    },
    {
      icon: Presentation,
      title: "PDF2PPT",
      desc: "PDF版本PPT转文字图标可编辑",
      color: "text-neon-pink",
      bg: "bg-neon-pink/10",
      border: "border-neon-pink/30"
    },
    {
      icon: Palette,
      title: "PPT Polish",
      desc: "专业级 PPT 智能润色",
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

  const { signUpWithEmail, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    try {
      if (inviteCode.trim()) {
        localStorage.setItem(INVITE_CODE_STORAGE_KEY, inviteCode.trim());
      }
    } catch {
      // ignore
    }

    // Client-side validation
    if (password !== confirmPassword) {
      setLocalError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setLocalError("密码长度至少为 6 位");
      return;
    }

    // signUpWithEmail will set needsOtpVerification if email confirmation is required
    // AuthGate will automatically show the OTP verification page
    await signUpWithEmail(email, password);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base p-4 relative overflow-hidden">
      {/* 动态背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-pink/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* 左侧：功能展示区 */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8">
          <div>
            <h1 className="text-5xl font-display font-bold text-lab-primary mb-4 leading-tight">
              加入 <span className="text-neon-pink">DataFlow</span>
            </h1>
            <p className="text-lab-secondary text-lg max-w-md">
              立即注册，开启 AI 驱动的科研创作新体验。
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={`transform transition-all duration-500 border rounded-xl p-4 flex items-center gap-4 ${
                  idx === featureIndex 
                    ? `scale-105 ${feature.bg} ${feature.border} shadow-[0_0_20px_rgba(236,72,153,0.15)] translate-x-4`
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
                    <ArrowRight className="text-neon-pink animate-bounce-x" size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：注册表单 */}
        <div className="bento-card scan-line p-8 md:p-10 w-full">
          <div className="lg:hidden mb-8 text-center">
             <h2 className="text-3xl font-display font-bold text-lab-primary mb-2">Paper2Any</h2>
             <p className="text-lab-secondary text-sm">创建您的新账号</p>
          </div>

          <h2 className="text-2xl font-display font-bold text-lab-primary mb-2">创建账号 ✨</h2>
          <p className="text-lab-secondary mb-8 text-sm">填写以下信息以完成注册</p>

          {displayError && (
            <div className="status-error mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <span className="text-sm leading-relaxed">{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="block text-xs font-medium text-lab-secondary ml-1">电子邮箱</label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
                  <Mail className="text-slate-500 group-focus-within:text-neon-pink transition-colors" size={18} />
                </div>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neon-input neon-input-with-icon"
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-lab-secondary ml-1">邀请码（可选）</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="neon-input w-full"
                placeholder="填写邀请码可为邀请人增加 5 点"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-password" className="block text-xs font-medium text-lab-secondary ml-1">密码</label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
                  <Lock className="text-slate-500 group-focus-within:text-neon-pink transition-colors" size={18} />
                </div>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neon-input neon-input-with-icon"
                  placeholder="至少 6 位字符"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-confirm-password" className="block text-xs font-medium text-lab-secondary ml-1">确认密码</label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
                  <Lock className="text-slate-500 group-focus-within:text-neon-pink transition-colors" size={18} />
                </div>
                <input
                  id="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="neon-input neon-input-with-icon"
                  placeholder="再次输入您的密码"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon glow w-full py-3.5 disabled:opacity-40 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>正在注册...</span>
                </>
              ) : (
                <>
                  <span>立即注册</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-lab-secondary text-sm">
              已有账号？{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-neon-pink hover:text-neon-pink/80 font-medium hover:underline transition-colors"
              >
                立即登录
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
