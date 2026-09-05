import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BackgroundVideo from './components/BackgroundVideo';
import './App.css';

function App() {
  // Theme state: 'light' (Morning Scene) or 'dark' (Evening Scene)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('chakkacheck_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Upload interface interactive states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageName, setImageName] = useState('');

  // Backend API states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Synchronize theme with data-theme attribute on root and persist preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chakkacheck_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Handle file drop & selection
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setAnalysisError('Please upload a valid image file (JPG, PNG, JPEG, or WebP).');
      return;
    }

    setSelectedFile(file);
    setImageName(file.name);
    setAnalysisError(null);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setSelectedFile(null);
    setImageName('');
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleTryAnother = () => {
    setUploadedImage(null);
    setSelectedFile(null);
    setImageName('');
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  // Backend API base URL — configured via environment variable for production (Render),
  // falls back to relative path for local development (handled by Vite proxy).
  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Analyze Scene using the backend API
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData,
        // When using fetch with FormData, do NOT manually set the Content-Type header
      });

      if (!response.ok) {
        let errorMessage = 'Failed to analyze the scene. Please try again.';
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          // If response is not JSON, use generic or status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        setAnalysisError('Unable to connect to the ChakkaCheck AI server. Please make sure the backend is running.');
      } else {
        setAnalysisError(error.message || 'Unable to connect to the ChakkaCheck AI server. Please make sure the backend is running.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Background Video System (Morning / Evening) */}
      <BackgroundVideo theme={theme} />

      {/* Main Storybook Interface Layer */}
      <div className="app-content-wrapper">
        <Navbar theme={theme} onToggleTheme={toggleTheme} />

        {/* Hero Section */}
        <main className="hero-section" id="home">
          
          {/* Top Hero Row: Left text + Center Upload + Right scenic space */}
          <div className="hero-poster-grid">
            
            {/* Left Column: Heading & Proverb */}
            <div className="hero-text-col">
              {/* Comic-style "THUD!" badge with speed bursts */}
              <div className="comic-thud-badge">
                <span className="thud-text">THUD!</span>
              </div>

              {/* Main Malayalam Proverb Heading */}
              <h1 className="hero-title-ml">
                ചക്ക വീണു<br />മുയൽ ചത്തു?
              </h1>

              {/* English Transliteration */}
              <p className="hero-title-en">
                Chakka Veenu Muyal Chathu?
              </p>

              {/* Concise Explanation */}
              <p className="hero-description">
                Upload an image and let our AI check if the scene matches the classic proverb.
              </p>

              {/* Left Wooden Sign: Part of the Kerala Scene */}
              <div className="wooden-sign-post-wrapper left-sign-wrapper">
                <div className="wooden-board">
                  <span className="board-line-1">SOME THINGS</span>
                  <span className="board-line-2">JUST HAPPEN</span>
                  <span className="board-line-3">BY LUCK! 🍀</span>
                </div>
                <div className="wooden-post"></div>
              </div>

              {/* Stone Prop on ground */}
              <div className="scenic-stone-prop">
                <span className="stone-text">BUILT WITH ☕ AND A BIT OF LUCK</span>
              </div>
            </div>

            {/* Center Column: Warm Cream Upload & Analysis Card */}
            <div className="hero-upload-col" id="analyze">
              <div className="upload-card">
                <h2 className="upload-card-title">
                  {analysisResult ? 'Analysis Result' : 'Check the Scene'}
                </h2>

                {/* Analysis Error Alert */}
                {analysisError && (
                  <div className="analysis-error-banner" role="alert">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{analysisError}</span>
                  </div>
                )}

                {/* State 1: Backend Analysis Result Panel */}
                {analysisResult ? (
                  <div className="result-panel">
                    {/* Verdict Banner */}
                    <div className="result-verdict-box">
                      <div className="verdict-tag-row">
                        <span className="verdict-label">Verdict</span>
                        <span className="score-badge">
                          Match Score: {analysisResult.match_score}%
                        </span>
                      </div>
                      <h3 className="verdict-text">{analysisResult.verdict}</h3>
                    </div>

                    {/* Detection Status Grid */}
                    <div className="detection-status-grid">
                      <div className="status-item">
                        <span className="status-label">🍈 Jackfruit</span>
                        <span className={`status-val ${analysisResult.jackfruit_detected ? 'detected' : 'not-detected'}`}>
                          {analysisResult.jackfruit_detected ? 'Detected' : 'Not Detected'}
                        </span>
                      </div>

                      <div className="status-item">
                        <span className="status-label">🐇 Rabbit</span>
                        <span className={`status-val ${analysisResult.rabbit_detected ? 'detected' : 'not-detected'}`}>
                          {analysisResult.rabbit_detected ? 'Detected' : 'Not Detected'}
                        </span>
                      </div>

                      <div className="status-item">
                        <span className="status-label">🌿 Wild Rabbit</span>
                        <span className={`status-val ${analysisResult.is_wild ? 'detected' : 'neutral'}`}>
                          {analysisResult.is_wild 
                            ? (analysisResult.rabbit_type ? `Yes (${analysisResult.rabbit_type})` : 'Yes (Wild)') 
                            : (analysisResult.rabbit_type ? `No (${analysisResult.rabbit_type})` : 'No')}
                        </span>
                      </div>

                      <div className="status-item">
                        <span className="status-label">💤 Unresponsive</span>
                        <span className={`status-val ${analysisResult.is_unresponsive ? 'detected' : 'neutral'}`}>
                          {analysisResult.is_unresponsive ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {/* Commentary */}
                    {analysisResult.commentary && (
                      <div className="result-callout commentary-callout">
                        <h4 className="callout-heading">💬 Commentary</h4>
                        <p className="callout-text">{analysisResult.commentary}</p>
                      </div>
                    )}

                    {/* Forensic Notes */}
                    {analysisResult.forensic_notes && (
                      <div className="result-callout forensic-callout">
                        <h4 className="callout-heading">🔍 Forensic Notes</h4>
                        <p className="callout-text">{analysisResult.forensic_notes}</p>
                      </div>
                    )}

                    {/* Action to Analyze Another Image */}
                    <button
                      type="button"
                      className="try-another-btn"
                      onClick={handleTryAnother}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="try-another-icon">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      Analyze Another Image
                    </button>
                  </div>
                ) : (
                  /* State 2 & 3: Dropzone or Selected Image Preview */
                  <>
                    {!uploadedImage ? (
                      <div
                        className={`dropzone ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          className="dropzone-file-input"
                          onChange={handleFileInput}
                          aria-label="Upload an image"
                        />
                        
                        <div className="dropzone-icon-box">
                          <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>

                        <p className="dropzone-main-text">Drag & drop an image here</p>
                        <p className="dropzone-or-text">or</p>
                        
                        <button 
                          type="button" 
                          className="choose-btn" 
                          onClick={() => document.querySelector('.dropzone-file-input')?.click()}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="choose-btn-icon">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Choose an Image
                        </button>

                        <p className="supported-formats-text">Supports: JPG, PNG, JPEG, WebP</p>
                      </div>
                    ) : (
                      <div className="preview-box">
                        <div className="preview-image-wrapper">
                          <img
                            src={uploadedImage}
                            alt="Scene preview"
                            className="preview-image"
                          />
                        </div>
                        <div className="preview-info-row">
                          <span className="file-name-text">{imageName}</span>
                          <button
                            type="button"
                            className="preview-remove-btn"
                            onClick={removeImage}
                            disabled={isAnalyzing}
                          >
                            Remove / Change
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Loading State Indicator */}
                    {isAnalyzing && (
                      <div className="analyzing-status-box">
                        <div className="analyzing-spinner"></div>
                        <p className="analyzing-main-msg">Analyzing your scene...</p>
                        <p className="analyzing-sub-msg">Checking jackfruit + rabbit...</p>
                      </div>
                    )}

                    {/* Analyze CTA Button */}
                    <button
                      type="button"
                      className="analyze-action-btn"
                      disabled={!selectedFile || isAnalyzing}
                      onClick={handleAnalyze}
                    >
                      {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with ChakkaCheck'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Scenic Area: Speech Bubble & Right Wooden Sign */}
            <div className="hero-scene-props-col">
              {/* Comic Speech Bubble */}
              <div className="comic-speech-bubble">
                <span className="bubble-text">Was it really the chakka?</span>
                <div className="bubble-tail"></div>
              </div>

              {/* Right Wooden Sign */}
              <div className="wooden-sign-post-wrapper right-sign-wrapper">
                <div className="wooden-board">
                  <span className="board-line-1">KERALA</span>
                  <span className="board-line-2">THINGS</span>
                  <span className="board-line-3">HIT DIFFERENT 🌴</span>
                </div>
                <div className="wooden-post"></div>
              </div>
            </div>

          </div>

          {/* 4 Pastel Feature Cards (Below Upload Card) */}
          <div className="feature-cards-row" id="features">
            {/* Card 1: Peach */}
            <div className="feature-card card-peach">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="card-svg">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="feature-title">Detects Jackfruit & Rabbit</h3>
              <p className="feature-subtitle">Looks for the key characters in the scene.</p>
            </div>

            {/* Card 2: Sky Blue */}
            <div className="feature-card card-blue">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="card-svg">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 className="feature-title">Analyzes the scene</h3>
              <p className="feature-subtitle">Checks how objects interact in context.</p>
            </div>

            {/* Card 3: Light Gold */}
            <div className="feature-card card-gold">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="card-svg">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
                </svg>
              </div>
              <h3 className="feature-title">Gives a proverb match score</h3>
              <p className="feature-subtitle">Calculates the likelihood of serendipity.</p>
            </div>

            {/* Card 4: Mint */}
            <div className="feature-card card-mint">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="card-svg">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <h3 className="feature-title">Just for fun!</h3>
              <p className="feature-subtitle">(But built with real AI)</p>
            </div>
          </div>

          {/* Proverb Quote Card */}
          <div className="proverb-quote-banner">
            <div className="quote-leaf-icon">🍃</div>
            <p className="quote-body-text">
              "Not everything in life is hard work. Sometimes, it's just chakka veenu muyal chathu."
            </p>
            <span className="quote-author-tag">— A Malayali somewhere</span>
          </div>

        </main>

        {/* Fun Facts Section */}
        <section className="storybook-section" id="fun-facts">
          <div className="section-inner">
            <div className="section-header center-text">
              <h2 className="section-title">Fun Facts</h2>
              <p className="section-subtitle">
                A few curious things about Kerala's favourite fruit and the legendary proverb.
              </p>
            </div>

            <div className="fun-facts-grid">
              {/* Fact 1 */}
              <div className="fact-card card-gold">
                <div className="fact-header">
                  <span className="fact-emoji">🍈</span>
                  <h3 className="fact-title">Chakka = Jackfruit</h3>
                </div>
                <p className="fact-text">
                  'Chakka' is the Malayalam word for jackfruit, which is also Kerala's proud official state fruit.
                </p>
              </div>

              {/* Fact 2 */}
              <div className="fact-card card-peach">
                <div className="fact-header">
                  <span className="fact-emoji">🌴</span>
                  <h3 className="fact-title">Kerala Loves Chakka</h3>
                </div>
                <p className="fact-text">
                  From crunchy chakka chips to sweet payasam, jackfruit is woven deeply into Kerala cuisine.
                </p>
              </div>

              {/* Fact 3 */}
              <div className="fact-card card-mint">
                <div className="fact-header">
                  <span className="fact-emoji">🌳</span>
                  <h3 className="fact-title">From Tree to Plate</h3>
                </div>
                <p className="fact-text">
                  Eaten at all stages: tender raw 'idichakka', crunchy fried slices, or golden sweet pods.
                </p>
              </div>

              {/* Fact 4 */}
              <div className="fact-card card-blue">
                <div className="fact-header">
                  <span className="fact-emoji">🎯</span>
                  <h3 className="fact-title">One Proverb, One Visual Test</h3>
                </div>
                <p className="fact-text">
                  ChakkaCheck turns a cherished saying about accidental luck into a fun computer vision test.
                </p>
              </div>

              {/* Fact 5 */}
              <div className="fact-card card-mint">
                <div className="fact-header">
                  <span className="fact-emoji">🤖</span>
                  <h3 className="fact-title">AI Doesn't Understand Luck</h3>
                </div>
                <p className="fact-text">
                  The model strictly evaluates visual proof in pixels. The luck part is purely Malayali humor!
                </p>
              </div>

              {/* Fact 6 */}
              <div className="fact-card card-peach">
                <div className="fact-header">
                  <span className="fact-emoji">🐇</span>
                  <h3 className="fact-title">Where's the Rabbit?</h3>
                </div>
                <p className="fact-text">
                  The fun really starts when an uploaded image actually contains both a jackfruit and a rabbit.
                </p>
              </div>

              {/* Fact 7 */}
              <div className="fact-card card-gold">
                <div className="fact-header">
                  <span className="fact-emoji">⚖️</span>
                  <h3 className="fact-title">Not Every Chakka Is a Match</h3>
                </div>
                <p className="fact-text">
                  A lone jackfruit isn't enough. Proximity and scene context decide the final match score.
                </p>
              </div>

              {/* Fact 8 */}
              <div className="fact-card card-blue">
                <div className="fact-header">
                  <span className="fact-emoji">💚</span>
                  <h3 className="fact-title">Made with Kerala Spirit</h3>
                </div>
                <p className="fact-text">
                  Because someone had to build an AI vision system specifically for this legendary proverb.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why ChakkaCheck? (About Section) */}
        <section className="storybook-section" id="about">
          <div className="section-inner">
            <div className="about-storybook-card">
              <div className="section-header center-text">
                <h2 className="section-title">Why ChakkaCheck?</h2>
                <p className="malayalam-proverb-highlight">"ചക്ക വീണു മുയൽ ചത്തു"</p>
              </div>

              <div className="about-text-content center-text">
                <p>
                  In Kerala, <strong>"ചക്ക വീണു മുയൽ ചത്തു"</strong> (Chakka veenu muyal chathu) is a beloved idiom used when someone succeeds purely through unexpected luck rather than deliberate effort.
                </p>
                <p>
                  <strong>ChakkaCheck</strong> takes that proverb completely literally. Instead of asking AI to solve corporate problems, we asked it one essential question:
                </p>
                <p className="about-italic-quote">
                  "Did the chakka really fall on the muyal?"
                </p>

                <div className="tech-pills-row">
                  <span className="tech-pill">🌿 Computer Vision</span>
                  <span className="tech-pill">🔍 Object Detection</span>
                  <span className="tech-pill">✨ Proverb Match Logic</span>
                  <span className="tech-pill">☕ Kerala Spirit</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="storybook-footer">
          <div className="footer-inner">
            <div className="footer-brand-row">
              <span className="footer-brand">ChakkaCheck</span>
              <span className="footer-tagline">— An AI take on a classic Kerala proverb</span>
            </div>
            <p className="footer-copy">
              Built with ☕ and a bit of luck in Kerala.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
