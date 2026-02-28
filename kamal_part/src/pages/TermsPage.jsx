export default function TermsPage() {
  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, padding: "100px 24px 80px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="hero-badge" style={{ marginBottom: 16 }}>Legal</div>
        <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "2.8rem", marginBottom: 12 }}>Terms of Service</h1>
        <p style={{ color: "var(--text)", fontWeight: 700 }}>Last updated: February, 2026</p>
      </div>

      {[
        {
          title: "1. Acceptance of Terms",
          content: `By creating an account or using LudoX in any way, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the platform. These terms apply to all users, including players, tournament participants, and visitors.`
        },
        {
          title: "2. Eligibility",
          content: `You must be at least 13 years old to use LudoX. To participate in cash prize tournaments, you must be at least 18 years old or the age of majority in your jurisdiction, whichever is higher. By registering, you confirm that you meet these age requirements. LudoX reserves the right to request age verification at any time.`
        },
        {
          title: "3. Account Responsibilities",
          content: `You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your account with others or use another player's account. You are fully responsible for all activity that occurs under your account. If you suspect unauthorized access, notify us immediately at support@ludox.app. LudoX is not liable for losses resulting from unauthorized account use.`
        },
        {
          title: "4. Fair Play and Prohibited Conduct",
          content: `LudoX is committed to fair and enjoyable gameplay for all. You agree not to use cheating software, bots, scripts, or any unauthorized tools to gain an advantage. You must not exploit bugs or glitches; any discovered bugs should be reported to our team. Harassment, hate speech, threats, or abusive behavior toward other players is strictly prohibited. Account sharing, collusion in tournaments, and match-fixing are grounds for immediate permanent ban. Violations may result in account suspension, forfeiture of prizes, and legal action where applicable.`
        },
        {
          title: "5. Tournament and Prize Rules",
          content: `Cash prize tournaments are subject to additional rules communicated at the time of entry. Prize payouts are processed within 7 business days of tournament completion. LudoX reserves the right to withhold prizes pending verification of eligibility and fair play compliance. Taxes on prize winnings are the sole responsibility of the winner. LudoX is not responsible for errors in payment details provided by users.`
        },
        {
          title: "6. Intellectual Property",
          content: `All content on LudoX, including the game interface, graphics, sound effects, brand name, logo, and code, is the intellectual property of LudoX and is protected by applicable copyright and trademark laws. You may not copy, distribute, modify, or create derivative works from any LudoX content without prior written permission. User-generated content such as chat messages remains your property, but you grant LudoX a license to display it within the platform.`
        },
        {
          title: "7. Random Number Generator (RNG)",
          content: `LudoX uses a certified and independently audited Random Number Generator for all dice rolls. Dice outcomes are entirely random and cannot be influenced by LudoX staff or any player. Results of dice rolls are final. Any claims of rigged outcomes are addressed through our formal dispute process — contact support@ludox.app with your game ID and we will provide a full audit log.`
        },
        {
          title: "8. Disclaimers and Limitation of Liability",
          content: `LudoX is provided on an "as is" basis without warranties of any kind. We do not guarantee uninterrupted or error-free service. To the fullest extent permitted by law, LudoX shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including loss of data, lost profits, or service interruptions. Our total liability to you shall not exceed the amount you paid to LudoX in the 3 months prior to the claim.`
        },
        {
          title: "9. Termination",
          content: `LudoX reserves the right to suspend or permanently ban any account that violates these Terms of Service, at our sole discretion and without prior notice. You may close your account at any time by contacting support@ludox.app. Upon termination, your right to use the platform ceases immediately. Provisions of these terms that by their nature should survive termination will remain in effect.`
        },
        {
          title: "10. Changes to Terms",
          content: `We reserve the right to modify these Terms of Service at any time. Significant changes will be communicated via email or in-app notification. Continued use of LudoX after changes take effect constitutes your acceptance of the revised terms. If you disagree with the updated terms, you must stop using the platform and may request account deletion.`
        },
        {
          title: "11. Governing Law",
          content: `These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from or relating to these terms shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria. If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force.`
        },
        {
          title: "12. Contact Us",
          content: `For questions about these Terms of Service, please contact our legal team at legal@ludox.app or write to LudoX Legal, 12 Game Street, Lagos, Nigeria.`
        },
      ].map(section => (
        <div key={section.title} className="card" style={{ padding: 28, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.3rem", color: "var(--blue)", marginBottom: 12 }}>{section.title}</h2>
          <p style={{ color: "var(--text)", lineHeight: 1.8, fontSize: "0.95rem" }}>{section.content}</p>
        </div>
      ))}
    </div>
  );
}