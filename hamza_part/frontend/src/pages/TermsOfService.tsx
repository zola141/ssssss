import React from 'react';
import './Legal.css';

export const TermsOfService: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: January 2026</p>

        <section>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using the Transcendence platform, you accept and agree to be bound by
            the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2>2. License to Use</h2>
          <p>
            Transcendence grants you a limited, non-exclusive, non-transferable license to access
            and use our platform for lawful purposes.
          </p>
        </section>

        <section>
          <h2>3. Acceptable Use Policy</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Engage in harassment, abuse, or discrimination</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Reverse engineer, decompile, or disassemble any part of our service</li>
            <li>Upload malware or malicious code</li>
            <li>Spam or engage in phishing activities</li>
            <li>Circumvent security measures or use bots</li>
          </ul>
        </section>

        <section>
          <h2>4. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account information
            and password. You agree to accept responsibility for all activities under your account.
          </p>
        </section>

        <section>
          <h2>5. Intellectual Property Rights</h2>
          <p>
            All content, features, and functionality are owned by Transcendence and are protected
            by international copyright and intellectual property laws.
          </p>
        </section>

        <section>
          <h2>6. User-Generated Content</h2>
          <p>
            By submitting content to Transcendence, you grant us a non-exclusive, worldwide,
            royalty-free license to use that content. You represent and warrant that you own
            or have the necessary rights to the content you submit.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            In no event shall Transcendence be liable for any indirect, incidental, special,
            consequential, or punitive damages, regardless of the cause of action.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            Our platform is provided on an "as-is" basis. We make no warranties, express or
            implied, regarding the service or any information, content, or materials accessed.
          </p>
        </section>

        <section>
          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Transcendence from any claims, damages,
            losses, or expenses arising from your violation of these terms or any other liability.
          </p>
        </section>

        <section>
          <h2>10. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account and access to our service
            at any time, without notice, for any reason or no reason.
          </p>
        </section>

        <section>
          <h2>11. Modifications to Terms</h2>
          <p>
            Transcendence reserves the right to modify these terms at any time. Your continued
            use of the platform following any changes constitutes your acceptance of those changes.
          </p>
        </section>

        <section>
          <h2>12. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws
            of the jurisdiction in which Transcendence is based.
          </p>
        </section>

        <section>
          <h2>13. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at:
            <br />
            <strong>Email:</strong> legal@transcendence.com
            <br />
            <strong>Address:</strong> Transcendence Inc., Legal Department
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
