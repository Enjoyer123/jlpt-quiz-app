import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login, register } from "../services/authService";

export default function AuthPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            if (mode === "login") {
                await login(email, password);
                onLoginSuccess();
                navigate(from, { replace: true });
            } else {
                await register(email, password);
                setSuccessMessage("Account created successfully. Please log in.");
                setMode("login");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "Unable to authenticate. Please try again.");
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
                            Sign in to continue the live quiz experience.
                        </h1>
                        <p className="mt-4 text-lg text-slate-600">
                            Use your registered account to access host history, join games, and keep your session authenticated securely.
                        </p>
                    </div>
                </header>

                <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Secure access</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">{mode === "login" ? "Log in" : "Register"}</h2>
                        </div>
                        <div className="inline-flex gap-2 rounded-full bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => { setMode("login"); setError(null); setSuccessMessage(null); }}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode("register"); setError(null); setSuccessMessage(null); }}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Register
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                        <div>
                            <label className="text-sm font-semibold text-slate-800" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                className="mt-2 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-800" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                minLength={6}
                                className="mt-2 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>

                        {error ? (
                            <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        ) : null}

                        {successMessage ? (
                            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {successMessage}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-slate-600">
                        {mode === "login"
                            ? "Need a new account?"
                            : "Already have an account?"}
                        <button
                            type="button"
                            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setSuccessMessage(null); }}
                            className="ml-2 font-semibold text-slate-900 underline decoration-slate-200 underline-offset-4"
                        >
                            {mode === "login" ? "Register here." : "Sign in."}
                        </button>
                    </p>
                </section>
            </div>
        </div>
    );
}
