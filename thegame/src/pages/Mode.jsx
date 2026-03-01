import "../styles/menu.css";


export default function Mode({ playersCount, setGameConfig }) {
  const gameType = "1v1";
  return (
    <div className="page">
      <h1 className="title">Mode de jeu</h1>

      <div className="cards">
        <div
          className="card"
          onClick={() =>
            setGameConfig({
              players: ["red", "yellow"],
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
              bots: ["yellow"],
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

