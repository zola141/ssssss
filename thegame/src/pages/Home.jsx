import "../styles/menu.css";


export default function Home({ setStep }) {

  return (
    <div className="page">
      <h1 className="title">🎲 Parchisi</h1>

      <div className="cards">
        <div className="card" onClick={() => setStep("players-2")}>
          <h2>2 Joueurs</h2>
          <p>1 vs 1</p>
        </div>

        <div className="card" onClick={() => setStep("players-4")}>
          <h2>4 Joueurs</h2>
          <p>Partie complète</p>
        </div>
      </div>
    </div>
  );
}
