import { useState } from "react";
import Home from "./pages/Home";
import Mode from "./pages/Mode";
import Game from "./pages/Game";

export default function App() {
  const [step, setStep] = useState("home");
  const [config, setConfig] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const urlMultiplayer = params.get("multiplayer");
  const roomCode = params.get("roomCode");
  const shouldUseUrl = roomCode || urlMultiplayer !== null;

  if (shouldUseUrl) {
    const multiplayer = roomCode ? true : urlMultiplayer !== "false";
    const effectiveGameType = "1v1";
    const players = ["red", "yellow"];
    const bots = multiplayer ? [] : ["yellow"];

    return (
      <Game
        players={players}
        bots={bots}
        gameType={effectiveGameType}
        multiplayer={multiplayer}
      />
    );
  }

  if (step === "home")
    return <Home setStep={setStep} />;

  if (step === "players-2")
    return <Mode playersCount={2} setGameConfig={(c) => {
      setConfig(c);
      setStep("game");
    }} />;

  if (step === "game")
    return (
      <Game
        players={config.players}
        bots={config.bots}
        gameType={config.gameType}
        multiplayer={config.multiplayer}
      />
    );
}
