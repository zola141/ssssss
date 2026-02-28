import React, { useState } from 'react';
import { dataExportAPI } from '../utils/api';
import '../styles/DataExport.css';

export const DataExport: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml'>(
    'json'
  );
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [importValidation, setImportValidation] = useState<any>(null);

  const handleExport = async (dataType: 'all' | 'matches') => {
    setLoading(true);
    setMessage('');
    try {
      const response =
        dataType === 'all'
          ? await dataExportAPI.exportAll(exportFormat)
          : await dataExportAPI.exportMatches(exportFormat);

      // Create blob and download
      const mimeTypes: { [key: string]: string } = {
        json: 'application/json',
        csv: 'text/csv',
        xml: 'application/xml',
      };

      const blob = new Blob([response.data], { type: mimeTypes[exportFormat] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${dataType}-${Date.now()}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(`Successfully exported ${dataType} data as ${exportFormat}`);
    } catch (error: any) {
      console.error('Export failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to export data';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleImportValidate = async () => {
    if (!importFile) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const result = await dataExportAPI.validateImport(importFile);
      setImportValidation(result.data);
      setMessage('File is valid');
    } catch (error: any) {
      console.error('Validation failed:', error);
      setMessage(
        error.response?.data?.error || 'Failed to validate file'
      );
      setImportValidation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const result = await dataExportAPI.importData(importFile);
      setMessage(
        `Successfully imported ${result.data.recordsImported} records`
      );
      setImportFile(null);
      setImportValidation(null);
    } catch (error: any) {
      console.error('Import failed:', error);
      setMessage(error.response?.data?.error || 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-export-container">
      <h2>Data Export & Import</h2>

      <div className="export-section">
        <h3>Export Data</h3>
        <div className="export-controls">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
          </select>

          <button
            onClick={() => handleExport('all')}
            disabled={loading}
          >
            Export All Data
          </button>
          <button
            onClick={() => handleExport('matches')}
            disabled={loading}
          >
            Export Matches Only
          </button>
        </div>
      </div>

      <div className="import-section">
        <h3>Import Data</h3>
        <div className="import-controls">
          <input
            type="file"
            accept=".json,.csv,.xml"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
          />

          <button onClick={handleImportValidate} disabled={loading || !importFile}>
            Validate File
          </button>

          {importValidation && (
            <div className="validation-result">
              <p>✓ File is valid</p>
              <ul>
                <li>Matches: {importValidation.recordCount.matches}</li>
                <li>User Stats: {importValidation.recordCount.userStats}</li>
                <li>User Activity: {importValidation.recordCount.userActivity}</li>
              </ul>
              <button onClick={handleImport} disabled={loading}>
                Proceed with Import
              </button>
            </div>
          )}
        </div>
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default DataExport;
