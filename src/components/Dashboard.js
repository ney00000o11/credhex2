import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Dashboard.css';

const Dashboard = ({ user, isDarkTheme }) => {
  const [certificates, setCertificates] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentPage === 'upload') {
      loadCertificates();
    }
  }, [currentPage]);

  const loadCertificates = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .list(`${user.id}/`, {
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
            .getPublicUrl(`${user.id}/${file.name}`);

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
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage
          .from('certificates')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        const newCertificate = {
          id: fileName,
          name: file.name,
          size: file.size,
          created_at: new Date().toISOString(),
          url: supabase.storage.from('certificates').getPublicUrl(filePath).data.publicUrl,
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
      const filePath = `${user.id}/${certificateId}`;
      const { error } = await supabase.storage
        .from('certificates')
        .remove([filePath]);

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
      const filePath = `${user.id}/${certificate.id}`;
      const { data, error } = await supabase.storage
        .from('certificates')
        .download(filePath);

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

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="dashboard-content">
            <div className="welcome-section">
              <h1 className="welcome-title">Welcome back, {user.email}!</h1>
              <p className="welcome-subtitle">Manage your digital certificates with ease</p>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{certificates.length}</div>
                  <div className="stat-label">Total Certificates</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {certificates.reduce((acc, cert) => acc + cert.size, 0) > 0 
                      ? formatFileSize(certificates.reduce((acc, cert) => acc + cert.size, 0))
                      : '0 Bytes'
                    }
                  </div>
                  <div className="stat-label">Storage Used</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {certificates.length > 0 
                      ? formatDate(Math.max(...certificates.map(cert => new Date(cert.created_at))))
                      : 'None'
                    }
                  </div>
                  <div className="stat-label">Last Upload</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="dashboard-content">
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
        );

      case 'settings':
        return (
          <div className="dashboard-content">
            <div className="settings-section">
              <h2 className="settings-title">Account Settings</h2>
              <div className="settings-card">
                <div className="setting-item">
                  <label>Email</label>
                  <input type="email" value={user.email} disabled />
                </div>
                <div className="setting-item">
                  <label>Account Created</label>
                  <input type="text" value={formatDate(user.created_at)} disabled />
                </div>
                <div className="setting-item">
                  <label>Email Confirmed</label>
                  <input type="text" value={user.email_confirmed_at ? 'Yes' : 'No'} disabled />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      {renderContent()}
      
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default Dashboard;