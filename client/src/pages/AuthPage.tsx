import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login, register } from "../services/authService";

// Map raw API / network errors to human-readable Thai/English messages
function getFriendlyError(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("email already") || lower.includes("already exists") || lower.includes("duplicate")) {
        return "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น หรือเข้าสู่ระบบแทน";
    }
    if (lower.includes("invalid email") || lower.includes("email format")) {
        return "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
    }
    if (lower.includes("invalid credentials") || lower.includes("unauthorized") || lower.includes("401")) {
        return "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
    }
    if (lower.includes("password") && lower.includes("length")) {
        return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    }
    if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch")) {
        return "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
    }
    if (lower.includes("timeout")) {
        return "การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง";
    }
    if (lower.includes("500") || lower.includes("server error") || lower.includes("internal")) {
        return "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง";
    }
    // Fallback: return original if it looks already readable
    return raw || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง";
}

function PasswordStrengthBar({ password }: { password: string }) {
    const strength = useMemo(() => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }, [password]);

    const labels = ["", "อ่อนมาก", "อ่อน", "พอใช้", "ดี", "แข็งแกร่ง"];
    const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"];
    const textColors = ["", "text-red-600", "text-orange-500", "text-yellow-600", "text-emerald-600", "text-emerald-700"];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength ? colors[strength] : "bg-slate-200"
                        }`}
                    />
                ))}
            </div>
            {strength > 0 && (
                <p className={`text-xs font-medium ${textColors[strength]}`}>
                    ความแข็งแกร่งของรหัสผ่าน: {labels[strength]}
                </p>
            )}
        </div>
    );
}

function InputField({
    id,
    label,
    type,
    value,
    onChange,
    required,
    minLength,
    placeholder,
    hint,
    errorHint,
}: {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    minLength?: number;
    placeholder?: string;
    hint?: string;
    errorHint?: string;
}) {
    return (
        <div>
            <label className="text-sm font-semibold text-slate-800" htmlFor={id}>
                {label}
                {required && <span className="ml-1 text-red-400">*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                minLength={minLength}
                placeholder={placeholder}
                className={`mt-2 w-full rounded-[18px] border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                    errorHint
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 bg-slate-50 focus:border-sky-400 focus:ring-sky-100"
                }`}
            />
            {errorHint && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errorHint}
                </p>
            )}
            {hint && !errorHint && (
                <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
            )}
        </div>
    );
}

export default function AuthPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = (location.state as { from?: { pathname?: string }; message?: string } | null) ?? null;
    const from = locationState?.from?.pathname ?? "/";
    const logoutMessage = locationState?.message ?? null;

    // Real-time confirm password validation (only show after user has typed something)
    const confirmError =
        mode === "register" && confirmPassword.length > 0 && password !== confirmPassword
            ? "รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง"
            : undefined;

    const switchMode = (next: "login" | "register") => {
        setMode(next);
        setError(null);
        setSuccessMessage(null);
        setPassword("");
        setConfirmPassword("");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // Client-side guard for register
        if (mode === "register") {
            if (password.length < 6) {
                setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
                return;
            }
            if (password !== confirmPassword) {
                setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
                return;
            }
        }

        setLoading(true);

        try {
            if (mode === "login") {
                await login(email, password);
                onLoginSuccess();
                navigate(from, { replace: true });
            } else {
                await register(email, password);
                setSuccessMessage("สร้างบัญชีสำเร็จแล้ว! กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้");
                switchMode("login");
            }
        } catch (err) {
            const raw = err instanceof Error ? err.message : String(err);
            setError(getFriendlyError(raw));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(232,121,249,0.2),_transparent_26%),linear-gradient(135deg,_#f8fcff_0%,_#f5fbf7_45%,_#faf6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <header className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8">
                    <div className="max-w-2xl">
                        <p className="mb-3 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                            JLPT Live Quiz
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            {mode === "login" ? "ยินดีต้อนรับกลับมา!" : "สร้างบัญชีใหม่"}
                        </h1>
                        <p className="mt-4 text-lg text-slate-600">
                            {mode === "login"
                                ? "เข้าสู่ระบบเพื่อเข้าถึงประวัติการเล่น จัดการเกม และประสบการณ์ Quiz สดแบบเต็มรูปแบบ"
                                : "สมัครสมาชิกฟรี เพื่อเริ่มสร้างและจัดการ Quiz ภาษาญี่ปุ่นของคุณ"}
                        </p>
                    </div>
                </header>

                <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                    {/* Mode toggle */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Secure access</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                {mode === "login" ? "เข้าสู่ระบบ" : "ลงทะเบียน"}
                            </h2>
                        </div>
                        <div className="inline-flex gap-2 rounded-full bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => switchMode("login")}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                เข้าสู่ระบบ
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode("register")}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                สมัครสมาชิก
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 grid gap-5" noValidate>
                        {/* Email */}
                        <InputField
                            id="email"
                            label="อีเมล"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            required
                            placeholder="example@email.com"
                        />

                        {/* Password */}
                        <div>
                            <InputField
                                id="password"
                                label="รหัสผ่าน"
                                type="password"
                                value={password}
                                onChange={setPassword}
                                required
                                minLength={6}
                                placeholder={mode === "register" ? "อย่างน้อย 6 ตัวอักษร" : ""}
                                hint={mode === "register" ? "ใช้ตัวอักษรผสมตัวเลขและสัญลักษณ์เพื่อเพิ่มความปลอดภัย" : undefined}
                            />
                            {mode === "register" && <PasswordStrengthBar password={password} />}
                        </div>

                        {/* Confirm Password — register only */}
                        {mode === "register" && (
                            <div>
                                <InputField
                                    id="confirmPassword"
                                    label="ยืนยันรหัสผ่าน"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    required
                                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                                    errorHint={confirmError}
                                />
                                {/* Matched indicator */}
                                {confirmPassword.length > 0 && !confirmError && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                        <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                                        </svg>
                                        รหัสผ่านตรงกัน
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.75a.75.75 0 001.5 0V8a.75.75 0 00-1.5 0v4.25zm.75 2.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Success / logout message banner */}
                        {(successMessage || logoutMessage) && (
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-emerald-700">{successMessage ?? logoutMessage}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || (mode === "register" && !!confirmError)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            )}
                            {loading
                                ? mode === "login" ? "กำลังเข้าสู่ระบบ..." : "กำลังสร้างบัญชี..."
                                : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-slate-600">
                        {mode === "login" ? "ยังไม่มีบัญชีใช่ไหม?" : "มีบัญชีอยู่แล้ว?"}
                        <button
                            type="button"
                            onClick={() => switchMode(mode === "login" ? "register" : "login")}
                            className="ml-2 font-semibold text-slate-900 underline decoration-slate-200 underline-offset-4 hover:decoration-slate-400"
                        >
                            {mode === "login" ? "สมัครสมาชิกที่นี่" : "เข้าสู่ระบบ"}
                        </button>
                    </p>
                </section>
            </div>
        </div>
    );
}
