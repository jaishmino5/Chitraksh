import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Initial Mock Past Runs for Stateful History
const initialPastRuns = [
  {
    id: 'pr-1',
    name: 'office_lobby_cam_24h.mp4',
    module: 'nazar',
    uploadedAt: '2026-05-26 18:22',
    size: '142 MB',
    duration: '2h 15m',
    query: 'Alert if someone enters the server room after hours',
    results: [
      { timestamp: '01:14:22 - 01:15:10', desc: 'Unidentified individual enters server room using secondary badge slot.', confidence: '96.2%' }
    ]
  },
  {
    id: 'pr-2',
    name: 'basketball_finals_q4.mp4',
    module: 'saar',
    uploadedAt: '2026-05-27 10:15',
    size: '88 MB',
    duration: '12m 30s',
    query: 'Extract all slam dunks and fast break sequences',
    results: [
      { timestamp: '02:15 - 02:22', desc: 'Slam dunk by number 23 from the left side corridor.', confidence: '94.8%' },
      { timestamp: '07:44 - 07:55', desc: 'Fast break and layout finish by forward player.', confidence: '92.1%' }
    ]
  }
];

function App() {
  // --- STATE-BASED ROUTING ---
  const [view, setView] = useState(() => {
    // Check if session has active view or default to landing
    const savedView = sessionStorage.getItem('chitraksh_view');
    return savedView || 'landing';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('chitraksh_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [projectsList, setProjectsList] = useState(() => {
    const saved = localStorage.getItem('chitraksh_runs');
    return saved ? JSON.parse(saved) : initialPastRuns;
  });

  // Save view state to session storage
  const navigateTo = (newView) => {
    setView(newView);
    sessionStorage.setItem('chitraksh_view', newView);
    window.scrollTo(0, 0);
  };

  // --- DEDICATED LOGIN / SIGNUP STATE ---
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authMessage, setAuthMessage] = useState({ type: '', text: '' });
  const [authLoading, setAuthLoading] = useState(false);

  // --- LANDING PAGE INTERACTIVE SANDBOX STATE ---
  const [sandboxVideo, setSandboxVideo] = useState('surveillance'); // 'surveillance' | 'sports'
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [sandboxResults, setSandboxResults] = useState(null);
  const [sandboxSearching, setSandboxSearching] = useState(false);
  const [sandboxPlayhead, setSandboxPlayhead] = useState(0);
  const [sandboxActiveHighlight, setSandboxActiveHighlight] = useState(null);

  // --- DASHBOARD WORKSPACE STATE ---
  const [dashboardModule, setDashboardModule] = useState('nazar'); // 'nazar' | 'saar'
  const [selectedProject, setSelectedProject] = useState(null);
  const [customUploadStep, setCustomUploadStep] = useState(0); // 0: idle, 1: uploading, 2: sampling, 3: VLM scan, 4: complete
  const [customUploadProgress, setCustomUploadProgress] = useState(0);
  const [customUploadFile, setCustomUploadFile] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [customSearching, setCustomSearching] = useState(false);
  const [customResults, setCustomResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Live CCTV Monitor Logging (Nazar Dashboard Widget)
  const [dashboardCctvLogs, setDashboardCctvLogs] = useState([
    { id: 1, time: '13:10:02', text: 'VLM Surveillance pipeline active.', type: 'info' },
    { id: 2, time: '13:10:14', text: 'Baseline environment analysis: Light index matches day setting.', type: 'info' }
  ]);
  const dashLogCounter = useRef(3);

  // Auto crop coordinates for Saar Dashboard Widget
  const [dashCropPos, setDashCropPos] = useState({ x: 30, y: 35 });
  const [dashPlayhead, setDashPlayhead] = useState(20);

  // Sync projects list to localStorage
  useEffect(() => {
    localStorage.setItem('chitraksh_runs', JSON.stringify(projectsList));
  }, [projectsList]);

  // Simulated Live log stream on Dashboard
  useEffect(() => {
    if (view !== 'dashboard') return;

    const logStream = setInterval(() => {
      const liveCctvEvents = [
        'Frame analysis active (30 fps) - bandwidth saving: 88%',
        'Static environment check completed. 0 anomalies detected.',
        'Object tracking: Human moving south to server corridor.',
        'Temporal sequence verified: Access card verified.',
        'Vehicle passed gate. Excluded from loitering logs.'
      ];
      const selected = liveCctvEvents[Math.floor(Math.random() * liveCctvEvents.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      setDashboardCctvLogs((prev) => [
        ...prev.slice(-4),
        { id: dashLogCounter.current++, time: timeStr, text: selected, type: 'info' }
      ]);
    }, 5000);

    return () => clearInterval(logStream);
  }, [view]);

  // Saar Dashboard coordinate tracking animation
  useEffect(() => {
    if (view !== 'dashboard' || dashboardModule !== 'saar') return;

    const cropInterval = setInterval(() => {
      const rx = Math.floor(Math.random() * 50) + 15;
      const ry = Math.floor(Math.random() * 40) + 15;
      setDashCropPos({ x: rx, y: ry });
      setDashPlayhead((prev) => (prev >= 95 ? 5 : prev + 6));
    }, 1800);

    return () => clearInterval(cropInterval);
  }, [view, dashboardModule]);

  // On startup, verify stored token and load user details
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('chitraksh_token');
      if (!token) {
        setCurrentUser(null);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setCurrentUser(data.user);
          localStorage.setItem('chitraksh_user', JSON.stringify(data.user));
        } else {
          // Token expired or invalid
          localStorage.removeItem('chitraksh_token');
          localStorage.removeItem('chitraksh_user');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Session verify failed:', err);
        const cachedUser = localStorage.getItem('chitraksh_user');
        if (cachedUser) {
          setCurrentUser(JSON.parse(cachedUser));
        }
      }
    };

    checkUserSession();
  }, []);

  // Interactive Sandbox triggers
  const runSandboxPrompt = (promptText, highlightRange, matchedResults) => {
    setSandboxPrompt(promptText);
    setSandboxSearching(true);
    setSandboxResults(null);
    setSandboxActiveHighlight(null);

    // Simulate VLM matching latency
    setTimeout(() => {
      setSandboxSearching(false);
      setSandboxResults(matchedResults);
      setSandboxActiveHighlight(highlightRange);
      setSandboxPlayhead(highlightRange.start);
    }, 1200);
  };

  // Auth form submissions (Register & Login)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: '', text: '' });

    if (!authEmail || !authPassword) {
      setAuthMessage({ type: 'error', text: 'Please enter all credentials.' });
      return;
    }

    if (authMode === 'signup' && !authName) {
      setAuthMessage({ type: 'error', text: 'Please enter your name.' });
      return;
    }

    if (authMode === 'signup' && authPassword !== authConfirmPassword) {
      setAuthMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setAuthLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyData = authMode === 'login' 
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();
      setAuthLoading(false);

      if (response.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('chitraksh_token', data.token);
        localStorage.setItem('chitraksh_user', JSON.stringify(data.user));
        
        setAuthMessage({ 
          type: 'success', 
          text: authMode === 'login' ? 'Access granted! Welcome back.' : 'Account created successfully!' 
        });

        setTimeout(() => {
          setAuthMessage({ type: '', text: '' });
          setAuthEmail('');
          setAuthPassword('');
          setAuthName('');
          setAuthConfirmPassword('');
          navigateTo('dashboard');
        }, 1000);
      } else {
        setAuthMessage({ type: 'error', text: data.message || 'Authentication failed' });
      }
    } catch (err) {
      console.error(err);
      setAuthLoading(false);
      setAuthMessage({ 
        type: 'error', 
        text: 'Network error. Please make sure the backend database server is started.' 
      });
    }
  };

  const triggerSocialAuth = (providerName) => {
    setAuthLoading(true);
    setAuthMessage({ type: '', text: '' });

    // Mock social auth redirect response (Simulated)
    setTimeout(() => {
      setAuthLoading(false);
      const dummyUser = { email: `user@${providerName}.com`, name: `${providerName.toUpperCase()} USER` };
      setCurrentUser(dummyUser);
      localStorage.setItem('chitraksh_token', 'mock_social_auth_token_secret_123');
      localStorage.setItem('chitraksh_user', JSON.stringify(dummyUser));
      navigateTo('dashboard');
    }, 1000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('chitraksh_token');
    localStorage.removeItem('chitraksh_user');
    navigateTo('landing');
  };

  // Custom File Uploader Sandbox logic (Dashboard View)
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processDashboardFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processDashboardFile(e.target.files[0]);
    }
  };

  const processDashboardFile = (file) => {
    setCustomUploadFile(file);
    setCustomUploadStep(1);
    setCustomUploadProgress(10);

    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 5;
      if (progress >= 100) {
        clearInterval(interval);
        setCustomUploadProgress(100);
        
        // Sampling Step
        setCustomUploadStep(2);
        setTimeout(() => {
          // VLM Scan Step
          setCustomUploadStep(3);
          setTimeout(() => {
            // Complete Step
            setCustomUploadStep(4);
          }, 1500);
        }, 1200);
      } else {
        setCustomUploadProgress(progress);
      }
    }, 200);
  };

  // Dashboard VLM Query Submission
  const handleDashboardQuery = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    setCustomSearching(true);
    setCustomResults(null);

    setTimeout(() => {
      setCustomSearching(false);
      let res;
      if (dashboardModule === 'nazar') {
        res = [
          { timestamp: '00:45 - 01:12', desc: 'Person loitering in targeted monitoring field.', confidence: '94.6%' }
        ];
      } else {
        res = [
          { timestamp: '01:22 - 01:34', desc: 'Subject visual velocity matches action peak. Vertical reframing generated.', confidence: '96.2%' }
        ];
      }
      setCustomResults(res);

      // Create a new past run object
      const newRun = {
        id: `pr-${Date.now()}`,
        name: customUploadFile ? customUploadFile.name : 'camera_feed_ingress.mp4',
        module: dashboardModule,
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        size: customUploadFile ? `${(customUploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '42 MB',
        duration: '1m 20s',
        query: customQuery,
        results: res
      };

      setProjectsList((prev) => [newRun, ...prev]);
      setSelectedProject(newRun);
    }, 1800);
  };

  // Trigger own file upload flow on homepage (Gate to Sign In)
  const handleHomepageIngestTrigger = () => {
    if (currentUser) {
      setDashboardModule('nazar');
      navigateTo('dashboard');
    } else {
      setAuthMode('login');
      setAuthMessage({ type: 'info', text: 'To process your own footage, please authenticate. Get 5 minutes free instantly.' });
      navigateTo('login');
    }
  };

  // Click on a past project from sidebar
  const loadPastRun = (run) => {
    setSelectedProject(run);
    setDashboardModule(run.module);
    setCustomUploadFile({ name: run.name });
    setCustomUploadStep(4);
    setCustomQuery(run.query);
    setCustomResults(run.results);
  };

  return (
    <>
      {/* Background elements */}
      <div className="grid-overlay"></div>
      <div className="orb orb-purple"></div>
      <div className="orb orb-cyan"></div>

      {/* ======================================================== */}
      {/* 1. STICKY CLEAN NAVBAR (Dynamic based on session view) */}
      {/* ======================================================== */}
      <nav className="navbar">
        <a href="#" onClick={() => navigateTo('landing')} className="nav-brand" id="nav-brand-logo">
          <div className="logo-eye"></div>
          Chitraksh AI
        </a>
        
        {view === 'landing' ? (
          <>
            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#sandbox" className="nav-link">Interactive Sandbox</a>
              <a href="#how-it-works" className="nav-link">How it Works</a>
              <a href="#architecture" className="nav-link">Architecture</a>
            </div>
            <div className="nav-actions">
              {currentUser ? (
                <button onClick={() => navigateTo('dashboard')} className="btn btn-primary" id="nav-btn-console">
                  Enter Console
                </button>
              ) : (
                <>
                  <button onClick={() => { setAuthMode('login'); navigateTo('login'); }} className="btn btn-secondary" id="nav-btn-signin">
                    Sign In
                  </button>
                  <button onClick={() => { setAuthMode('signup'); navigateTo('login'); }} className="btn btn-primary" id="nav-btn-signup">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="nav-actions" style={{ marginLeft: 'auto' }}>
            {currentUser ? (
              <div className="user-profile-badge" id="profile-badge">
                <span className="avatar-circle">{currentUser.name[0]}</span>
                <span>{currentUser.name}</span>
                <button onClick={handleLogout} className="logout-icon-btn" title="Log Out" id="nav-btn-logout">
                  Logout ✕
                </button>
              </div>
            ) : (
              <button onClick={() => navigateTo('landing')} className="btn btn-secondary" id="nav-btn-home">
                Back to Site
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ======================================================== */}
      {/* VIEW: LANDING PAGE */}
      {/* ======================================================== */}
      {view === 'landing' && (
        <main className="landing-layout">
          
          {/* 2. THE HERO SECTION (Above the Fold) */}
          <section className="hero-section">
            <div className="sanskrit-tag">चित्राक्ष : spatiotemporal video intelligence</div>
            <h1 className="hero-title" id="main-hero-title">
              Chat with Your Video.<br />
              <span>Extract What Matters.</span>
            </h1>
            <p className="hero-description">
              Chitraksh is a spatiotemporal AI platform that turns raw video footage into searchable, actionable intelligence using natural language prompts. Eliminate alert fatigue and stop manual scrubbing.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginBottom: '3.5rem' }}>
              <button onClick={() => { setAuthMode('signup'); navigateTo('login'); }} className="btn btn-primary" id="hero-btn-deploy">
                Deploy Free Version
              </button>
              <a href="#sandbox" className="btn btn-secondary" id="hero-btn-demo">
                Watch Demo
              </a>
            </div>

            {/* Interactive Hero Visual (Teaser / Sandbox Widget) */}
            <div className="glass-panel interactive-teaser-box" id="sandbox">
              <div className="teaser-widget-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="sim-dot" style={{ backgroundColor: 'var(--color-saar)' }}></div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Interactive Teaser Sandbox (No Login Required)</span>
                </div>
                <div className="teaser-tab-selector">
                  <button 
                    className={`teaser-tab-btn ${sandboxVideo === 'surveillance' ? 'active-purple' : ''}`}
                    onClick={() => { setSandboxVideo('surveillance'); setSandboxPrompt(''); setSandboxResults(null); setSandboxActiveHighlight(null); }}
                  >
                    🚨 CAM-07 Surveillance
                  </button>
                  <button 
                    className={`teaser-tab-btn ${sandboxVideo === 'sports' ? 'active-cyan' : ''}`}
                    onClick={() => { setSandboxVideo('sports'); setSandboxPrompt(''); setSandboxResults(null); setSandboxActiveHighlight(null); }}
                  >
                    🎬 Soccer Derby Clipper
                  </button>
                </div>
              </div>

              <div className="teaser-sandbox-content">
                {/* Visual simulator player screen */}
                <div className="teaser-player-canvas">
                  {sandboxVideo === 'surveillance' ? (
                    <div className="surveillance-player-mock">
                      <div className="camera-overlay-top">
                        <span>CAM-07 BACK YARD</span>
                        <span className="camera-rec"><span className="rec-dot">🔴</span> REC LIVE</span>
                      </div>
                      
                      {/* Bounding loitering mock boxes */}
                      {sandboxActiveHighlight && (
                        <div className="camera-box-mock" style={{ borderStyle: 'solid', animation: 'none', background: 'rgba(168, 85, 247, 0.15)' }}>
                          SUBJECT LOITERING DETECTED<br />
                          Confidence: 96% | Time: {sandboxPlayhead}%
                        </div>
                      )}
                      
                      <div className="camera-overlay-top" style={{ marginTop: 'auto' }}>
                        <span>VLM AGENT DETECT MODE</span>
                        <span>05-27-2026 13:15:22</span>
                      </div>
                    </div>
                  ) : (
                    <div className="sports-player-mock">
                      <div className="camera-overlay-top">
                        <span>9:16 CROP CANVAS PREVIEW</span>
                        <span style={{ color: 'var(--color-saar)' }}>⚽ ACTIVE ACTION TARGET</span>
                      </div>

                      {/* Sliding reframer crops */}
                      <div 
                        className="saar-action-subject" 
                        style={{ 
                          left: sandboxActiveHighlight ? '45%' : '15%', 
                          top: '25%',
                          width: '65px',
                          height: '90px'
                        }}
                      ></div>

                      <div className="camera-overlay-top" style={{ marginTop: 'auto' }}>
                        <span>TRACKING: SOCCER BALL</span>
                        <span>HIGHLIGHT ACTIVE</span>
                      </div>
                    </div>
                  )}

                  {/* Playback timeline tracker */}
                  <div className="saar-timelines" style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px' }}>
                    <div className="saar-timeline-slider">
                      {sandboxActiveHighlight && (
                        <div 
                          className="saar-highlight-segment" 
                          style={{ 
                            left: `${sandboxActiveHighlight.start}%`, 
                            width: `${sandboxActiveHighlight.end - sandboxActiveHighlight.start}%`,
                            backgroundColor: sandboxVideo === 'surveillance' ? 'var(--color-nazar)' : 'var(--color-saar)',
                            boxShadow: sandboxVideo === 'surveillance' ? '0 0 10px var(--color-nazar)' : '0 0 10px var(--color-saar)'
                          }}
                        ></div>
                      )}
                      <div className="saar-timeline-playhead" style={{ left: `${sandboxPlayhead}%` }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      <span>0:00</span>
                      <span>{sandboxVideo === 'surveillance' ? '0:40' : '0:30'}</span>
                      <span>{sandboxVideo === 'surveillance' ? '1:20' : '1:00'}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated action prompts */}
                <div className="teaser-actions-panel">
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem', fontWeight: 600 }}>Select a sample VLM query:</h4>
                  {sandboxVideo === 'surveillance' ? (
                    <div className="teaser-buttons-grid">
                      <button 
                        onClick={() => runSandboxPrompt(
                          'Find when the delivery guy arrived', 
                          { start: 15, end: 40 },
                          'At [00:15 - 00:32] delivery personnel enters back corridor wearing high-visibility vest. Packages placed at loading bay.'
                        )}
                        className="teaser-action-btn nazar"
                      >
                        🚚 Find delivery arrival
                      </button>
                      <button 
                        onClick={() => runSandboxPrompt(
                          'Detect loitering near storage building', 
                          { start: 55, end: 90 },
                          'At [00:45 - 01:10] individual loitering near storage building. Stayed inside secure gate zone for > 15s.'
                        )}
                        className="teaser-action-btn nazar"
                      >
                        👤 Check loitering rule
                      </button>
                    </div>
                  ) : (
                    <div className="teaser-buttons-grid">
                      <button 
                        onClick={() => runSandboxPrompt(
                          'Find the goal scored', 
                          { start: 30, end: 50 },
                          'At [00:22 - 00:30] soccer ball enters top-left corner of net. Crowds trigger acoustic intensity spike.'
                        )}
                        className="teaser-action-btn saar"
                      >
                        ⚽ Isolate goal highlight
                      </button>
                      <button 
                        onClick={() => runSandboxPrompt(
                          'Find when player slides', 
                          { start: 70, end: 85 },
                          'At [00:42 - 00:48] slide tackle event leading to yellow card alert. Dynamic crop box shifts centered.'
                        )}
                        className="teaser-action-btn saar"
                      >
                        🏃 Locate slide tackle
                      </button>
                    </div>
                  )}

                  {/* Simulated output console logs */}
                  <div className="teaser-console-log">
                    {sandboxSearching && (
                      <div className="log-running">
                        <span className="sim-dot pulse"></span> Searching temporal visual timelines...
                      </div>
                    )}
                    {!sandboxSearching && !sandboxResults && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '15px' }}>
                        Click a button above to run local VLM timeline analysis
                      </div>
                    )}
                    {!sandboxSearching && sandboxResults && (
                      <div className="log-output-box" id="sandbox-vlm-log">
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Query: "{sandboxPrompt}"
                        </div>
                        <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                          {sandboxResults}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. THE DUAL-CORE SPLIT FEATURES (Nazar vs Saar) */}
          <section className="showcase-section" id="features">
            <div className="section-header">
              <span className="section-subtitle">Specialized Architecture</span>
              <h2 className="section-title">Split Core Engines Built for Target Verticals</h2>
              <p className="section-desc">
                Chitraksh parses surveillance and action video separately, optimization loops built specifically for distinct business cases.
              </p>
            </div>

            {/* Split Grid */}
            <div className="engine-grid">
              
              {/* Section A: Nazar (Smart Surveillance) */}
              <article className="engine-card nazar">
                <div className="engine-card-header">
                  <div>
                    <h3 className="engine-name">Chitraksh / Nazar 🚨</h3>
                    <div className="engine-tagline">Stop Tracking Motion. Start Understanding Context.</div>
                  </div>
                  <span className="engine-tag">Surveillance Engine</span>
                </div>
                <p className="engine-text">
                  Designed for security operators and small businesses tired of getting a ping every time a stray animal walks by or the wind blows a tree. Nazar adds zero-shot visual triggers.
                </p>

                <div className="blueprint-feature-grid">
                  <div className="bp-feat-card">
                    <span className="bp-feat-icon">🎯</span>
                    <h5>Zero-Shot Alerts</h5>
                    <p>Ask the feed anything: "Alert me only if a car parks in the loading dock for more than 15 minutes."</p>
                  </div>
                  <div className="bp-feat-card">
                    <span className="bp-feat-icon">⚡</span>
                    <h5>Behavior Tracking</h5>
                    <p>Detect complex sequence patterns (e.g. distinguishing someone dropping off inventory vs. picking it up).</p>
                  </div>
                </div>
              </article>

              {/* Section B: Saar (Dynamic Action Clipper) */}
              <article className="engine-card saar">
                <div className="engine-card-header">
                  <div>
                    <h3 className="engine-name">Chitraksh / Saar 🎬</h3>
                    <div className="engine-tagline">Clip via Action, Not Just Audio Transcripts.</div>
                  </div>
                  <span className="engine-tag">Content Engine</span>
                </div>
                <p className="engine-text">
                  Designed for content creators and sports analysts whose viral highlights or critical tracking moments happen completely silently without audio references.
                </p>

                <div className="blueprint-feature-grid">
                  <div className="bp-feat-card">
                    <span className="bp-feat-icon">📽️</span>
                    <h5>Trajectory Highlighting</h5>
                    <p>Type: "Find the exact moment the soccer ball hits the top corner of the net."</p>
                  </div>
                  <div className="bp-feat-card">
                    <span className="bp-feat-icon">📐</span>
                    <h5>Smart Auto-Reframe</h5>
                    <p>The AI tracks the moving subject and dynamically changes standard wide footage into vertical 9:16 layout formats.</p>
                  </div>
                </div>
              </article>

            </div>
          </section>

          {/* 4. THE INTERACTIVE "HOW IT WORKS" FLOW */}
          <section className="how-it-works-section" id="how-it-works">
            <div className="section-header">
              <span className="section-subtitle">Visual Timeline</span>
              <h2 className="section-title">How It Works</h2>
              <p className="section-desc">From raw pixels to cognitive highlights in four quick steps.</p>
            </div>

            <div className="timeline-flow-grid">
              <div className="timeline-step">
                <div className="step-num-bubble">1</div>
                <h4>Ingest</h4>
                <p>Drop your .mp4 video files or connect a continuous live stream interface.</p>
              </div>
              <div className="timeline-step">
                <div className="step-num-bubble">2</div>
                <h4>Optimize</h4>
                <p>Our background FFmpeg processor automatically strips redundant duplicate frames to optimize data tokens.</p>
              </div>
              <div className="timeline-step">
                <div className="step-num-bubble">3</div>
                <h4>Prompt</h4>
                <p>Enter any plain-English query into our unified VLM inference layer.</p>
              </div>
              <div className="timeline-step">
                <div className="step-num-bubble">4</div>
                <h4>Action</h4>
                <p>Get instant timestamps, specific activity flags, or ready-to-download vertical video clips.</p>
              </div>
            </div>
          </section>

          {/* 5. TECHNICAL TRUST & ARCHITECTURE STACK */}
          <section className="architecture-section" id="architecture">
            <div className="section-header">
              <span className="section-subtitle">Developer Specifications</span>
              <h2 className="section-title">Technical Trust & Architecture</h2>
              <p className="section-desc">
                High availability API wrappers powered by Node.js, MongoDB, and Gemini 1.5 Pro / Qwen2-VL Spatiotemporal Backbones.
              </p>
            </div>

            <div className="arch-stack-layout">
              {/* Dummy Code Snippet Component */}
              <div className="code-snippet-box glass-panel">
                <div className="code-header">
                  <span className="code-dot red"></span>
                  <span className="code-dot yellow"></span>
                  <span className="code-dot green"></span>
                  <span className="code-filename">request_inference.js</span>
                </div>
                <pre className="code-pre">
                  <code>
{`// Query Chitraksh VLM Analytics endpoint
const analyzeVideo = async () => {
  const response = await fetch('https://api.chitraksh.ai/v1/analyze', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_VLM_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoUrl: 'https://storage.chitraksh.ai/lobby_cam_07.mp4',
      prompt: 'Alert if someone loiters near the back exit',
      rules: { thresholdSeconds: 30 }
    })
  });
  
  const { taskId, matches } = await response.json();
  console.log(\`Analysis complete. Matches detected: \${matches.length}\`);
};`}
                  </code>
                </pre>
              </div>

              {/* Stack Details Box */}
              <div className="arch-specs-panel glass-panel">
                <h4>Engine Pipeline Infrastructure</h4>
                <ul className="arch-specs-list">
                  <li><strong>Ingestion:</strong> Multi-part chunk streams uploading to MongoDB GRIDFS cache layers.</li>
                  <li><strong>Optimization:</strong> Zero-entropy FFmpeg keyframe decoders saving 84% API bandwidth.</li>
                  <li><strong>Backbones:</strong> Deep visual semantic mapping using Google Gemini 1.5 Pro large contexts.</li>
                  <li><strong>Security:</strong> AES-256 stateful session tokens restricting custom uploads behind accounts.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Conversion Gateway File Drop Area (Gate to Auth) */}
          <section className="playground-section" style={{ borderTop: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div className="section-header">
              <span className="section-subtitle" style={{ color: 'var(--color-nazar)' }}>Sandbox Workspace</span>
              <h2 className="section-title">Ready to test your own footage?</h2>
              <p className="section-desc">Upload custom security feeds or sports sequences to process your files.</p>
            </div>
            
            <div 
              className="upload-dropzone" 
              onClick={handleHomepageIngestTrigger}
              id="landing-video-gate"
            >
              <span className="upload-icon-pulse">📤</span>
              <h3 className="upload-title">Drop Your Video File Here</h3>
              <p className="upload-subtitle">Click or drag your own .mp4 surveillance file to analyze visual paths.</p>
              <button className="btn btn-secondary">Select Custom Video</button>
            </div>
          </section>

          {/* 6. BOTTOM CALL TO ACTION (The Closer) */}
          <section className="closer-section">
            <h2 className="closer-heading">Ready to give your video feeds an intelligent eye?</h2>
            <p className="closer-desc">Create your free workspace portal to start prompting custom timelines today.</p>
            <button onClick={() => { setAuthMode('signup'); navigateTo('login'); }} className="btn btn-primary btn-large" id="closer-btn-action">
              Start Building for Free
            </button>
          </section>

        </main>
      )}

      {/* ======================================================== */}
      {/* VIEW: DEDICATED LOGIN / SIGNUP PAGE */}
      {/* ======================================================== */}
      {view === 'login' && (
        <main className="auth-page-layout">
          <button onClick={() => navigateTo('landing')} className="auth-back-btn" id="btn-back-home">
            ← Back to Homepage
          </button>

          <div className="auth-card glass-panel" id="dedicated-auth-card">
            <div className="auth-card-header">
              <div className="logo-eye" style={{ margin: '0 auto 12px auto', width: '36px', height: '36px', borderWidth: '3px' }}></div>
              <h2 className="auth-title">Welcome to Chitraksh AI</h2>
              <p className="auth-subtitle">
                {authMode === 'login' ? 'Access your spatiotemporal console workspace' : 'Get 5 free video minutes and index your timelines'}
              </p>
            </div>

            {/* Social logins */}
            <div className="social-auth-buttons">
              <button onClick={() => triggerSocialAuth('github')} className="social-auth-btn" id="btn-social-github">
                <svg className="social-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
              <button onClick={() => triggerSocialAuth('google')} className="social-auth-btn" id="btn-social-google">
                <svg className="social-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.564-4.444 10.564-10.74 0-.721-.077-1.274-.172-1.975H12.24z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                    id="auth-input-name"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  id="auth-input-email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  id="auth-input-password"
                />
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    required
                    id="auth-input-confirm"
                  />
                </div>
              )}

              {authMessage.text && (
                <div className={`auth-alert ${authMessage.type}`} id="auth-alert-box">
                  {authMessage.type === 'success' ? '✓ ' : '⚠️ '}
                  {authMessage.text}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary submit-btn" 
                disabled={authLoading}
                id="auth-btn-submit"
              >
                {authLoading ? 'Signing In...' : authMode === 'login' ? 'Access Console' : 'Register Console Account'}
              </button>
            </form>

            <div className="auth-toggle-msg">
              {authMode === 'login' ? (
                <>
                  New to Chitraksh?{' '}
                  <span className="auth-toggle-link" onClick={() => setAuthMode('signup')} id="auth-toggle-to-signup">
                    Create Account
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="auth-toggle-link" onClick={() => setAuthMode('login')} id="auth-toggle-to-login">
                    Sign In here
                  </span>
                </>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* VIEW: POST-LOGIN STATEFUL DASHBOARD */}
      {/* ======================================================== */}
      {view === 'dashboard' && (
        <main className="dashboard-layout">
          
          {/* Left Panel: Past Runs Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="sidebar-section-header">WORKSPACE CONSOLE</div>
            
            <div className="sidebar-module-toggles">
              <button 
                className={`sidebar-toggle-btn ${dashboardModule === 'nazar' ? 'active-nazar' : ''}`}
                onClick={() => { setDashboardModule('nazar'); setSelectedProject(null); setCustomUploadFile(null); setCustomUploadStep(0); setCustomResults(null); setCustomQuery(''); }}
              >
                🚨 Nazar Surveillance
              </button>
              <button 
                className={`sidebar-toggle-btn ${dashboardModule === 'saar' ? 'active-saar' : ''}`}
                onClick={() => { setDashboardModule('saar'); setSelectedProject(null); setCustomUploadFile(null); setCustomUploadStep(0); setCustomResults(null); setCustomQuery(''); }}
              >
                🎬 Saar Social Clipper
              </button>
            </div>

            <div className="sidebar-section-header" style={{ marginTop: '2rem' }}>PROJECT RUNS HISTORY</div>
            <div className="past-runs-list" id="runs-history-list">
              {projectsList.filter(p => p.module === dashboardModule).length === 0 ? (
                <div className="runs-history-empty">No history. Ingest a video to start.</div>
              ) : (
                projectsList.filter(p => p.module === dashboardModule).map((run) => (
                  <button 
                    key={run.id}
                    className={`past-run-card ${selectedProject?.id === run.id ? 'active' : ''}`}
                    onClick={() => loadPastRun(run)}
                  >
                    <div className="run-card-title">{run.name}</div>
                    <div className="run-card-meta">
                      <span>{run.uploadedAt}</span>
                      <span>•</span>
                      <span>{run.duration}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Right Panel: Workspaces Area */}
          <section className="dashboard-workspace">
            <div className="workspace-header">
              <div>
                <h2>{dashboardModule === 'nazar' ? '🚨 Nazar Surveillance Workspace' : '🎬 Saar Clipper Workspace'}</h2>
                <p className="workspace-subheader">
                  {dashboardModule === 'nazar' 
                    ? 'Stateful CCTV behavior indexer and anomaly trigger logic.' 
                    : 'Visually extract silence-proof timelines and export 9:16 vertical segments.'
                  }
                </p>
              </div>
            </div>

            {/* Ingestion Sandbox (File Dropzone or Active Analysis) */}
            <div className="workspace-body-grid">
              
              {/* Left Column: Upload / Query console */}
              <div className="workspace-console-controls">
                
                {/* Custom File Upload Box */}
                {customUploadStep === 0 ? (
                  <div 
                    className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    id="dash-video-dropzone"
                  >
                    <span className="upload-icon-pulse">📤</span>
                    <h3 className="upload-title">Ingest Video Track</h3>
                    <p className="upload-subtitle">Drag your surveillance or sports mp4 file to begin VLM pre-processing.</p>
                    <label htmlFor="dash-file-id" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                      Select File
                    </label>
                    <input 
                      id="dash-file-id"
                      type="file" 
                      style={{ display: 'none' }} 
                      accept="video/*" 
                      onChange={handleFileInput}
                    />
                  </div>
                ) : customUploadStep < 4 ? (
                  <div className="glass-panel upload-progress-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span>
                        {customUploadStep === 1 && `Ingesting ${customUploadFile?.name || 'video'}...`}
                        {customUploadStep === 2 && 'FFmpeg Stripping Keyframes...'}
                        {customUploadStep === 3 && 'Running foundation VLM query mapping...'}
                      </span>
                      <span>{customUploadStep === 1 ? `${customUploadProgress}%` : 'Running'}</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: customUploadStep === 1 ? `${customUploadProgress}%` : customUploadStep === 2 ? '65%' : '85%' 
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel active-video-meta">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{customUploadFile?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: Visually Indexed | Tokens saved: 84%</div>
                      </div>
                      <button onClick={() => { setCustomUploadStep(0); setCustomUploadFile(null); setCustomResults(null); setSelectedProject(null); setCustomQuery(''); }} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Reset Track
                      </button>
                    </div>

                    {/* VLM query submission inside dashboard */}
                    <form onSubmit={handleDashboardQuery} style={{ marginTop: '1.25rem' }}>
                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label className="form-label">Query Video Track</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={dashboardModule === 'nazar' ? 'e.g. Alert if someone stays by gate' : 'e.g. Find all running highlights'}
                          value={customQuery}
                          onChange={(e) => setCustomQuery(e.target.value)}
                          required
                          disabled={customSearching}
                          id="dash-query-input"
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={customSearching} id="dash-btn-ask">
                        {customSearching ? 'Searching Timeline...' : 'Prompt VLM'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Query timeline outputs */}
                {customSearching && (
                  <div className="glass-panel" style={{ padding: '20px', marginTop: '1.5rem', textAlign: 'center' }}>
                    <span className="sim-dot pulse" style={{ backgroundColor: dashboardModule === 'nazar' ? 'var(--color-nazar)' : 'var(--color-saar)' }}></span>
                    <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>Reading spatiotemporal indexes...</p>
                  </div>
                )}

                {customResults && !customSearching && (
                  <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }} id="dash-results-card">
                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Occurrences Detected</h4>
                    {customResults.map((r, index) => (
                      <div key={index} className="sim-match-item" style={{ background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{r.timestamp}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.desc}</div>
                        </div>
                        <span className="sim-match-conf">{r.confidence}</span>
                      </div>
                    ))}
                    
                    {dashboardModule === 'saar' ? (
                      <button className="btn btn-saar" style={{ width: '100%', marginTop: '1.25rem' }} id="btn-export-saar">
                        📥 Download Vertical 9:16 Reframe
                      </button>
                    ) : (
                      <button className="btn btn-nazar" style={{ width: '100%', marginTop: '1.25rem' }} id="btn-alert-nazar">
                        🔔 Configure Loitering Notification
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* Right Column: Live dashboard simulators */}
              <div className="workspace-visual-output">
                {dashboardModule === 'nazar' ? (
                  <div className="demo-widget-wrapper" style={{ margin: 0 }}>
                    <div className="widget-bar">
                      <div className="widget-title-flex">
                        <span className="widget-status-dot"></span>
                        <span>SURVEILLANCE CAM INGRESS #01</span>
                      </div>
                      <span>ACTIVE VLM FEED</span>
                    </div>
                    <div className="nazar-feed">
                      <div className="camera-overlay-top">
                        <span>CAM-01/SECURE</span>
                        <span className="camera-rec"><span className="rec-dot">🔴</span> LIVE ANALYTICS</span>
                      </div>
                      <div className="camera-box-mock">
                        ANALYSIS READY<br />
                        Prompt target tracks indexed
                      </div>
                      <div className="camera-overlay-top" style={{ marginTop: 'auto' }}>
                        <span>FPS: 30 | SAVING: 84%</span>
                        <span>LIVE TIMESTAMP LOGS</span>
                      </div>
                    </div>
                    <div className="nazar-logs">
                      {dashboardCctvLogs.map((log) => (
                        <div key={log.id} className="log-entry">
                          <span className="log-time">[{log.time}]</span>
                          <span className="log-body">{log.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="demo-widget-wrapper" style={{ margin: 0 }}>
                    <div className="widget-bar">
                      <div className="widget-title-flex">
                        <span className="widget-status-dot" style={{ backgroundColor: 'var(--color-saar)' }}></span>
                        <span>SAAR AUTOMATIC CROP PREVIEW</span>
                      </div>
                      <span>9:16 PREVIEW</span>
                    </div>
                    <div className="saar-video-simulator">
                      <div className="saar-source-aspect">
                        <div 
                          className="saar-action-subject" 
                          style={{ 
                            left: `${dashCropPos.x}%`, 
                            top: `${dashCropPos.y}%`,
                            width: '55px',
                            height: '75px'
                          }}
                        ></div>
                        <span className="saar-tracker">Subject lock active</span>
                      </div>
                    </div>
                    <div className="saar-timelines">
                      <div className="saar-track-label">VIDEO HIGHLIGHT PEAKS</div>
                      <div className="saar-timeline-slider">
                        <div className="saar-highlight-segment" style={{ left: '20%', width: '15%' }}></div>
                        <div className="saar-highlight-segment" style={{ left: '50%', width: '20%' }}></div>
                        <div className="saar-timeline-playhead" style={{ left: `${dashPlayhead}%` }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        <span>0:00</span>
                        <span>0:40</span>
                        <span>1:20</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>

        </main>
      )}

      {/* Unified Footer */}
      <footer className="footer">
        <div className="footer-content">
          <a href="#" onClick={() => navigateTo('landing')} className="footer-logo">
            <div className="logo-eye" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            Chitraksh AI
          </a>
          <div className="footer-links">
            <a href="#" onClick={() => navigateTo('landing')} className="footer-link">Home Site</a>
            <a href="#" onClick={() => { setAuthMode('login'); navigateTo('login'); }} className="footer-link">Sign In</a>
            <a href="https://github.com" className="footer-link" target="_blank" rel="noreferrer">Open Source GitHub</a>
          </div>
          <div className="footer-copy">
            &copy; 2026 Chitraksh AI Platform. Under MIT Licence. Dedicated to Chitraksh & Jaish.
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
