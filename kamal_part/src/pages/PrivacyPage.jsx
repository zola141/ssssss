export default function PrivacyPage() {
  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, padding: "100px 24px 80px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="hero-badge" style={{ marginBottom: 16 }}>Legal</div>
        <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "2.8rem", marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ color: "var(--text)", fontWeight: 700 }}>Last updated: February, 2026</p>
      </div>

      {[
        {
          title: "1. Information We Collect",
          content: `When you create a LudoX account, we collect your full name, username, email address, and gender. During gameplay, we collect gameplay data including move history, dice rolls, game results, win/loss records, and tournament participation. We also collect technical data such as your IP address, browser type, device information, and cookies to maintain your session and improve performance.`
        },
        {
          title: "2. How We Use Your Information",
          content: `We use your information to create and manage your account, operate multiplayer game sessions in real time, calculate rankings and leaderboard standings, process tournament entries and prize payouts, send important account notifications, and improve our platform based on usage patterns. We do not sell your personal data to third parties under any circumstances.`
        },
        {
          title: "3. Data Sharing",
          content: `Your username and game statistics (wins, points, win rate) are visible to other players on the public leaderboard. Your email address and personal details are never shared publicly. We may share data with trusted service providers who assist us in operating the platform, such as payment processors for prize payouts and cloud hosting providers, under strict confidentiality agreements.`
        },
        {
          title: "4. Cookies",
          content: `LudoX uses cookies to keep you logged in between sessions, remember your preferences, and analyze how our platform is used. You can disable cookies in your browser settings, but doing so may prevent some features from working correctly, including staying logged in and joining game rooms.`
        },
        {
          title: "5. Data Retention",
          content: `We retain your account data for as long as your account is active. If you request account deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal or financial compliance purposes (for example, records of prize payouts).`
        },
        {
          title: "6. Security",
          content: `We take reasonable technical and organizational measures to protect your data, including encrypted connections (HTTPS), hashed passwords, and access controls. However, no system is completely secure, and we cannot guarantee absolute security. Please use a strong, unique password for your LudoX account.`
        },
        {
          title: "7. Children's Privacy",
          content: `LudoX is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal data, we will delete it promptly. If you believe a child has registered, please contact us immediately.`
        },
        {
          title: "8. Your Rights",
          content: `You have the right to access the personal data we hold about you, correct inaccurate data, request deletion of your account and associated data, and opt out of non-essential communications. To exercise any of these rights, contact us at privacy@ludox.app.`
        },
        {
          title: "9. Changes to This Policy",
          content: `We may update this Privacy Policy from time to time. When we do, we will update the date at the top of this page and, where the changes are significant, notify you by email or an in-app notification. Continued use of LudoX after changes constitutes acceptance of the updated policy.`
        },
        {
          title: "10. Contact",
          content: `If you have questions or concerns about this Privacy Policy or how your data is handled, please contact us at privacy@ludox.app or write to us at LudoX, 12 Game Street, Lagos, Nigeria.`
        },
      ].map(section => (
        <div key={section.title} className="card" style={{ padding: 28, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.3rem", color: "var(--yellow)", marginBottom: 12 }}>{section.title}</h2>
          <p style={{ color: "var(--text)", lineHeight: 1.8, fontSize: "0.95rem" }}>{section.content}</p>
        </div>
      ))}
    </div>
  );
}