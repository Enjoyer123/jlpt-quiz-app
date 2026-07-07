import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../services/authService";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        let active = true;

        isLoggedIn()
            .then((result) => {
                if (active) setAuthorized(result);
            })
            .catch(() => {
                if (active) setAuthorized(false);
            });

        return () => {
            active = false;
        };
    }, [location.pathname]);

    if (authorized === null) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-6xl items-center justify-center rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.25)] backdrop-blur">
                    <span className="text-lg font-semibold text-slate-700">Checking authentication…</span>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
