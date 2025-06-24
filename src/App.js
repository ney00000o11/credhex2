import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Silk from './Silk';
import { supabase } from './supabaseClient';

function App() {
  const [certificates, setCertificates] = useState([]);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .list('', {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('Error loading certificates:', error);
        return;
      }

      const certificatesWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(file.name);

          return {
            id: file.id,
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            url: urlData.publicUrl,
          };
        })
      );

      setCertificates(certificatesWithUrls);
    } catch (error) {
      console.error('Error loading certificates:', error);
      showNotification('Failed to load certificates', 'error');
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('certificates')
          .upload(fileName, file);

        if (error) {
          throw error;
        }

        const newCertificate = {
          id: fileName,
          name: file.name,
          size: file.size,
          created_at: new Date().toISOString(),
          url: supabase.storage.from('certificates').getPublicUrl(fileName).data.publicUrl,
        };

        setCertificates(prev => [...prev, newCertificate]);
      }

      showNotification(`${files.length} certificate(s) uploaded successfully!`, 'success');
    } catch (error) {
      console.error('Error uploading files:', error);
      showNotification('Failed to upload certificates', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCertificate = async (certificateId, fileName) => {
    try {
      const { error } = await supabase.storage
        .from('certificates')
        .remove([certificateId]);

      if (error) {
        throw error;
      }

      setCertificates(prev => prev.filter(cert => cert.id !== certificateId));
      showNotification('Certificate deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting certificate:', error);
      showNotification('Failed to delete certificate', 'error');
    }
  };

  const handleDownloadCertificate = async (certificate) => {
    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .download(certificate.id);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = certificate.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('Certificate downloaded!', 'success');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      showNotification('Failed to download certificate', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`App ${isDarkTheme ? 'dark-theme' : ''}`}>
      <div className="silk-background">
        <Silk
          speed={5}
          scale={1}
          color={isDarkTheme ? "#2D1B69" : "#7B7481"}
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="main-content">
        <header className="header">
          <div className="logo-section">
            <img 
              src="https://static.vecteezy.com/system/resources/previews/014/179/558/original/certificate-icons-design-in-blue-circle-png.png" 
              alt="CredHex Logo" 
              className="logo"
            />
            <h1 className="app-title">CredHex</h1>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
        </header>

        <section className="upload-section">
          <h2 className="upload-title">Upload Your Certificates</h2>
          <div className="upload-area" onClick={handleUploadAreaClick}>
            <div className="upload-icon">
              {isUploading ? <div className="loading-spinner"></div> : '📄'}
              }
            </div>
            <p className="upload-text">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="upload-subtext">
              PDF, JPG, PNG files up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="file-input"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
        </section>

        <section className="certificates-section">
          {certificates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-text">No certificates uploaded yet</p>
              <p className="empty-subtext">Upload your first certificate to get started</p>
            </div>
          ) : (
            <div className="certificates-grid">
              {certificates.map((certificate) => (
                <div key={certificate.id} className="certificate-card">
                  <div className="certificate-header">
                    <div className="certificate-icon">📜</div>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteCertificate(certificate.id, certificate.name)}
                      title="Delete certificate"
                    >
                      ×
                    </button>
                  </div>
                  <h3 className="certificate-name">{certificate.name}</h3>
                  <p className="certificate-size">{formatFileSize(certificate.size)}</p>
                  <p className="certificate-date">
                    Uploaded: {formatDate(certificate.created_at)}
                  </p>
                  <button
                    className="certificate-download"
                    onClick={() => handleDownloadCertificate(certificate)}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;