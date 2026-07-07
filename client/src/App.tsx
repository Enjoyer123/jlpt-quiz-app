import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import HostPage from "./pages/HostPage";
import PlayerPage from "./pages/PlayerPage";
import HistoryPage from "./pages/HistoryPage";

const roles = [
    {
        title: "Host",
        description: "Create a room, guide the quiz flow, and reveal each answer with a warm, playful touch.",
        href: "/host",
        accent: "from-emerald-400 to-lime-400",
        icon: "🎮",
    },
    {
        title: "Player",
        description: "Join a live room, answer quick questions, and watch the leaderboard bloom in real time.",
        href: "/player",
        accent: "from-sky-400 to-cyan-400",
        icon: "✨",
    },
    {
        title: "History",
        description: "Review completed rooms, scores, and the stories behind past sessions.",
        href: "/history",
        accent: "from-fuchsia-400 to-violet-400",
        icon: "📚",
    },
];

function LandingPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.25),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(217,70,239,0.18),_transparent_34%),linear-gradient(135deg,_#f8fbff_0%,_#f5f7ff_55%,_#f8f6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="mb-3 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                                JLPT Live Quiz
                            </p>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                A bright, playful way to practice Japanese together.
                            </h1>
                            <p className="mt-4 text-lg text-slate-600">
                                Step into a friendly learning room, join the game, or revisit previous matches with a polished, game-like experience.
                            </p>
                        </div>
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                            <p className="font-semibold text-slate-800">Choose your role</p>
                            <p className="mt-1">Host a room, join as a player, or open your history.</p>
                        </div>
                    </div>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    {roles.map((role) => (
                        <Link
                            key={role.title}
                            to={role.href}
                            className="group rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_14px_40px_-25px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_55px_-20px_rgba(15,23,42,0.35)]"
                        >
                            <div className={`inline-flex rounded-2xl bg-gradient-to-br ${role.accent} p-3 text-2xl shadow-sm`}>
                                {role.icon}
                            </div>
                            <h2 className="mt-4 text-xl font-bold text-slate-900">{role.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{role.description}</p>
                            <span className="mt-4 inline-flex items-center text-sm font-semibold text-slate-700 transition group-hover:translate-x-1">
                                Open {role.title.toLowerCase()} view →
                            </span>
                        </Link>
                    ))}
                </section>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/host" element={<HostPage />} />
                <Route path="/player" element={<PlayerPage />} />
                <Route path="/history" element={<HistoryPage />} />
            </Routes>
        </BrowserRouter>
    );
}