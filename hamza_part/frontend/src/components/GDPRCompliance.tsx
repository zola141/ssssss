import React, { useState } from 'react';
import { gdprAPI } from '../utils/api';
import '../styles/GDPR.css';

export const GDPRCompliance: React.FC<{ userId: string }> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [deletionModal, setDeletionModal] = useState(false);
  const [deletionToken, setDeletionToken] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleDataRequest = async () => {
    setLoading(true);
    try {
      await gdprAPI.requestData(userId);
      setMessage(
        'Data request submitted. Check your email for confirmation and download link.'
      );
    } catch (error) {
      console.error('Error requesting data:', error);
      setMessage('Failed to request data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletionRequest = async () => {
    setLoading(true);
    try {
      const deletionResult = await gdprAPI.requestDeletion(userId);
      setDeletionToken(deletionResult.data.token);
      setMessage(
        'Deletion request received. Check your email for confirmation link.'
      );
      setDeletionModal(true);
    } catch (error) {
      console.error('Error requesting deletion:', error);
      setMessage('Failed to request deletion');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (confirmPassword !== 'CONFIRM') {
      setMessage('Please type CONFIRM to proceed');
      return;
    }

    setLoading(true);
    try {
      await gdprAPI.confirmDeletion(deletionToken);
      setMessage('Your account has been deleted successfully.');
      setDeletionModal(false);
    } catch (error) {
      console.error('Error confirming deletion:', error);
      setMessage('Failed to confirm deletion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gdpr-container">
      <h2>GDPR Compliance & Privacy</h2>

      <div className="gdpr-section">
        <h3>Your Data Rights</h3>
        <p>
          Under GDPR, you have the right to access, export, and delete your personal
          data.
        </p>

        <div className="gdpr-actions">
          <div className="action-card">
            <h4>Request Your Data</h4>
            <p>
              Download all your personal information in a readable format (JSON).
            </p>
            <button onClick={handleDataRequest} disabled={loading}>
              Request Data Export
            </button>
          </div>

          <div className="action-card">
            <h4>Delete Your Account</h4>
            <p>
              Permanently delete your account and all associated data. This action
              cannot be undone.
            </p>
            <button onClick={handleDeletionRequest} disabled={loading}>
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {deletionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Account Deletion</h3>
            <p>
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <p>Type <strong>CONFIRM</strong> to proceed:</p>
            <input
              type="text"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type CONFIRM"
            />
            <div className="modal-actions">
              <button
                onClick={handleConfirmDeletion}
                disabled={loading || confirmPassword !== 'CONFIRM'}
                className="danger"
              >
                Delete Account
              </button>
              <button
                onClick={() => {
                  setDeletionModal(false);
                  setConfirmPassword('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GDPRCompliance;
