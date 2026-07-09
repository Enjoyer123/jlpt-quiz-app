import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../services/apiClient";
import { getCurrentUser } from "../services/authService";

interface ProfileSummary {
    email: string;
    id: number;
    deckCount: number;
    hostedGameCount: number;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const user = getCurrentUser();
                const data = await fetchJson<ProfileSummary>("/api/auth/profile", { method: "GET" });
                setProfile({
                    ...data,
                    email: user?.email ?? data.email,
                });
            } catch {
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, []);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(232,121,249,0.2),_transparent_26%),linear-gradient(135deg,_#f8fcff_0%,_#f5fbf7_45%,_#faf6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
                <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div>
                        <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                            Profile
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Your account snapshot.
                        </h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-600">
                            Review your account details and the decks and games you have created.
                        </p>
                    </div>
                    <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        ← Back home
                    </Link>
                </header>

                <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-4 w-24 rounded-full bg-slate-200" />
                            <div className="h-10 w-3/4 rounded-2xl bg-slate-200" />
                            <div className="h-20 rounded-[20px] bg-slate-100" />
                        </div>
                    ) : profile ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Account</p>
                                <p className="mt-3 text-sm text-slate-600">Email</p>
                                <p className="text-lg font-semibold text-slate-900">{profile.email}</p>
                                <p className="mt-4 text-sm text-slate-600">User ID</p>
                                <p className="text-lg font-semibold text-slate-900">{profile.id}</p>
                            </div>
                            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Overview</p>
                                <p className="mt-3 text-sm text-slate-600">Total Decks</p>
                                <p className="text-lg font-semibold text-slate-900">{profile.deckCount}</p>
                                <p className="mt-4 text-sm text-slate-600">Total Games Hosted</p>
                                <p className="text-lg font-semibold text-slate-900">{profile.hostedGameCount}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600">Unable to load your profile right now.</p>
                    )}
                </section>
            </div>
        </div>
    );
}
