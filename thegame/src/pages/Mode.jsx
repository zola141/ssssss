import "../styles/menu.css";


export default function Mode({ playersCount, setGameConfig }) {
  const gameType = playersCount === 2 ? "1v1" : "4-player";
  return (
    <div className="page">
      <h1 className="title">Mode de jeu</h1>

      <div className="cards">
        <div
          className="card"
          onClick={() =>
            setGameConfig({
              players: playersCount === 2 ? ["red", "yellow"] : ["red", "green", "blue", "yellow"],
              bots: [],
              gameType,
              multiplayer: true
            })
          }
        >
          <h2>👥 Multiplayer</h2>
          <p>Jouer en ligne</p>
        </div>

        <div
          className="card"
          onClick={() =>
            setGameConfig({
              players: ["red"],
              bots: playersCount === 2 ? ["yellow"] : ["green", "blue", "yellow"],
              gameType,
              multiplayer: false
            })
          }
        >
          <h2>🤖 Bots</h2>
          <p>Défie l'IA</p>
        </div>
      </div>
    </div>
  );
}

