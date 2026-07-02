import { useState } from "react";
import HostPage from "./pages/HostPage";
import PlayerPage from "./pages/PlayerPage";

export default function App() {
    const [role, setRole] = useState<"host" | "player" | null>(null);

    if (role === "host") return <HostPage />;
    if (role === "player") return <PlayerPage />;

    return (
        <div>
            <h1>JLPT Live Quiz</h1>
            <p>เลือกบทบาทของคุณ</p>
            <button onClick={() => setRole("host")}>🎮 สร้างห้อง (Host)</button>
            <button onClick={() => setRole("player")}>👤 เข้าห้อง (Player)</button>
        </div>
    );
}