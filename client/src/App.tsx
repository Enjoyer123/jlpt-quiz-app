import { useState } from "react";
import HostPage from "./pages/HostPage";
import PlayerPage from "./pages/PlayerPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
    const [role, setRole] = useState<"host" | "player" | "history" | null>(null);

    if (role === "host") return <HostPage />;
    if (role === "player") return <PlayerPage />;
    if (role === "history") return <HistoryPage />;

    return (
        <div>
            <h1>JLPT Live Quiz</h1>
            <p>เลือกบทบาทของคุณ</p>
            <button onClick={() => setRole("host")}>สร้างห้อง (Host)</button>
            <button onClick={() => setRole("player")}>เข้าห้อง (Player)</button>
            <button onClick={() => setRole("history")}>ประวัติการเล่น</button>
        </div>
    );
}