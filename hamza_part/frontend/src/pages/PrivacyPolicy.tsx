import React from 'react';
import './Legal.css';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: January 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Transcendence ("we," "our," or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our analytics and gaming platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we
            may collect on the site includes:</p>
          <ul>
            <li><strong>Personal Data:</strong> Name, email address, username, profile picture, and other
              identifiable information you provide</li>
            <li><strong>Game Data:</strong> Match history, scores, rankings, game statistics, and performance metrics</li>
            <li><strong>Activity Data:</strong> Login times, actions performed, timestamps, and usage patterns</li>
            <li><strong>Technical Data:</strong> IP address, browser type, operating system, and device information</li>
          </ul>
        </section>

        <section>
          <h2>3. Use of Information</h2>
          <p>Transcendence uses the information we collect or receive:</p>
          <ul>
            <li>To provide, maintain, and improve our services</li>
            <li>To process transactions and send you related information</li>
            <li>To generate analytics and prepare statistical reports</li>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To send promotional communications (with your consent)</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Protection & GDPR Compliance</h2>
          <p>
            We comply with the General Data Protection Regulation (GDPR). You have the right to:
          </p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to certain processing activities</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the
            "Contact Us" section below.
          </p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            We retain your personal data for as long as necessary to provide our services and
            comply with applicable laws. You can request deletion of your data at any time.
          </p>
        </section>

        <section>
          <h2>6. Disclosure of Information</h2>
          <p>
            We do not sell, trade, or rent your personal data to third parties. We may disclose
            information when required by law or to protect our rights.
          </p>
        </section>

        <section>
          <h2>7. Security of Information</h2>
          <p>
            We use administrative, technical, and physical security measures to protect your
            information. However, no method of transmission over the internet is completely secure.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            <strong>Email:</strong> privacy@transcendence.com
            <br />
            <strong>Address:</strong> Transcendence Inc., Data Protection Officer
          </p>
        </section>

        <section>
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by updating the "Last updated" date at the top of this page.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
