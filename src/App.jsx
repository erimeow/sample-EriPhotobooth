import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(null);

  // USER CHOICES
  const [targetPhotoCount, setTargetPhotoCount] = useState(3);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [frameColor, setFrameColor] = useState('#ffffff');
  const [frameDesign, setFrameDesign] = useState('classic');

  const [photos, setPhotos] = useState([]);
  const [currentPhotoNum, setCurrentPhotoNum] = useState(0);
  const [stripImage, setStripImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stripCanvasRef = useRef(null);

  const filterList = [
    { id: 'none', name: 'Original' },
    { id: 'grayscale', name: 'Grayscale' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'bright', name: 'Bright' },
    { id: 'contrast', name: 'Contrast' },
    { id: 'cool', name: 'Cool Blue' },
    { id: 'warm', name: 'Warm Glow' },
    { id: 'cyberpunk', name: 'Cyberpunk' }
  ];

  const frameColors = [
    { name: 'Classic White', hex: '#ffffff' },
    { name: 'Cyan Blue', hex: '#e0f7fa' },
    { name: 'Midnight Black', hex: '#111111' },
    { name: 'Pastel Pink', hex: '#ffd1dc' },
    { name: 'Retro Cream', hex: '#fbf0d9' }
  ];

  const frameDesignList = [
    { id: 'classic', name: 'Classic Clean' },
    { id: 'polaroid', name: 'Polaroid Style' },
    { id: 'dots', name: 'Polka Dots' },
    { id: 'neon', name: 'Neon Glow Border' }
  ];

  const startCamera = async () => {
    setIsCameraOpen(true);
    setErrorMsg('');
    setPhotos([]);
    setStripImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Camera Access Denied');
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const context = canvas.getContext('2d');

      // Mirror transformation para maging katulad sa live video
      context.translate(canvas.width, 0);
      context.scale(-1, 1);

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/png');
    }
    return null;
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const startPhotoSequence = async () => {
    setPhotos([]);
    setStripImage(null);
    const capturedPhotos = [];

    for (let i = 1; i <= targetPhotoCount; i++) {
      setCurrentPhotoNum(i);

      for (let count = 3; count > 0; count--) {
        setCountdown(count);
        await wait(1000);
      }

      setCountdown('📸');
      const newPhoto = captureSnapshot();
      if (newPhoto) {
        capturedPhotos.push(newPhoto);
        setPhotos([...capturedPhotos]);
      }

      await wait(600);
      setCountdown(null);

      if (i < targetPhotoCount) {
        await wait(1000);
      }
    }

    setCurrentPhotoNum(0);
  };

  // HELPER FUNCTION: MANUAL PIXEL FILTER PROCESSING (MOBILE COMPATIBLE)
  const applyMobilePixelFilter = (ctx, x, y, width, height, filterType) => {
    if (filterType === 'none') return;

    const imgData = ctx.getImageData(x, y, width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (filterType === 'grayscale') {
        const avg = 0.3 * r + 0.59 * g + 0.11 * b;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      } else if (filterType === 'sepia') {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      } else if (filterType === 'vintage') {
        data[i] = Math.min(255, r * 0.4 + g * 0.6 + b * 0.2);
        data[i + 1] = Math.min(255, r * 0.3 + g * 0.5 + b * 0.2);
        data[i + 2] = Math.min(255, r * 0.2 + g * 0.3 + b * 0.3);
      } else if (filterType === 'bright') {
        data[i] = Math.min(255, r * 1.25);
        data[i + 1] = Math.min(255, g * 1.25);
        data[i + 2] = Math.min(255, b * 1.25);
      } else if (filterType === 'contrast') {
        const factor = 1.4;
        data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
      } else if (filterType === 'cool') {
        data[i] = Math.max(0, r - 20);
        data[i + 1] = g;
        data[i + 2] = Math.min(255, b + 40);
      } else if (filterType === 'warm') {
        data[i] = Math.min(255, r + 30);
        data[i + 1] = Math.min(255, g + 15);
        data[i + 2] = Math.max(0, b - 20);
      } else if (filterType === 'cyberpunk') {
        data[i] = Math.min(255, r + 50);
        data[i + 1] = Math.max(0, g - 20);
        data[i + 2] = Math.min(255, b + 60);
      }
    }

    ctx.putImageData(imgData, x, y);
  };

  // CANVAS PHOTO STRIP GENERATION
  const generatePhotoStrip = () => {
    if (photos.length !== targetPhotoCount) return;

    const stripCanvas = stripCanvasRef.current;
    if (!stripCanvas) return;

    const ctx = stripCanvas.getContext('2d');

    const photoWidth = 400;
    const photoHeight = 300;
    const padding = 20;
    const headerHeight = 20;
    const footerHeight = 80;

    const canvasWidth = photoWidth + (padding * 2);
    const canvasHeight = headerHeight + (photoHeight * targetPhotoCount) + (padding * (targetPhotoCount + 1)) + footerHeight;

    stripCanvas.width = canvasWidth;
    stripCanvas.height = canvasHeight;

    // 1. Draw Background Base
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw Frame Pattern Overlay
    if (frameDesign === 'dots') {
      ctx.fillStyle = frameColor === '#111111' ? 'rgba(255,255,255,0.15)' : 'rgba(0,131,176,0.15)';
      for (let x = 10; x < canvasWidth; x += 25) {
        for (let y = 10; y < canvasHeight; y += 25) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    let loadedCount = 0;
    const imgElements = [];

    photos.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        imgElements[index] = img;

        if (loadedCount === targetPhotoCount) {
          imgElements.forEach((photoImg, i) => {
            const yPos = headerHeight + padding + i * (photoHeight + padding);

            // Polaroid Border Option
            if (frameDesign === 'polaroid') {
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(0,0,0,0.2)';
              ctx.shadowBlur = 10;
              ctx.fillRect(padding - 8, yPos - 8, photoWidth + 16, photoHeight + 16);
              ctx.shadowColor = 'transparent';
            }

            // Draw Base Image
            ctx.drawImage(photoImg, padding, yPos, photoWidth, photoHeight);

            // APPLY MOBILE-FRIENDLY PIXEL FILTER
            applyMobilePixelFilter(ctx, padding, yPos, photoWidth, photoHeight, selectedFilter);

            // Neon Border Option
            if (frameDesign === 'neon') {
              ctx.strokeStyle = '#00f2fe';
              ctx.lineWidth = 4;
              ctx.shadowColor = '#00f2fe';
              ctx.shadowBlur = 12;
              ctx.strokeRect(padding, yPos, photoWidth, photoHeight);
              ctx.shadowColor = 'transparent';
            }
          });

          // 3. Draw ERI PHOTOBOOTH Footer Text
          ctx.fillStyle = frameColor === '#111111' ? '#00f2fe' : '#0083b0';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';

          const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          ctx.fillText('ERI PHOTOBOOTH', canvasWidth / 2, canvasHeight - 45);
          ctx.font = '14px sans-serif';
          ctx.fillText(dateStr, canvasWidth / 2, canvasHeight - 20);

          setStripImage(stripCanvas.toDataURL('image/png'));
        }
      };
    });
  };

  useEffect(() => {
    if (photos.length === targetPhotoCount) {
      generatePhotoStrip();
    }
  }, [photos, selectedFilter, frameColor, frameDesign, targetPhotoCount]);

  const handleRetake = () => {
    startCamera();
  };

  return (
    <div className="photobooth-container">
      <h1 className="title">ERI PHOTOBOOTH</h1>

      {/* STEP 1: HOME PAGE & SHOT SELECTOR */}
      {!isCameraOpen && (
        <div>
          <p style={{ fontSize: '18px', color: '#555' }}>
            Pick your photoshoot length and click start!
          </p>

          <div className="option-group">
            <h3 style={{ margin: '0 0 10px 0', color: '#0083b0' }}>Select Number of Shots:</h3>
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => setTargetPhotoCount(count)}
                className={`btn-option ${targetPhotoCount === count ? 'active' : ''}`}
              >
                {count} Photos
              </button>
            ))}
          </div>

          <button 
            onClick={startCamera}
            style={{
              padding: '14px 32px',
              fontSize: '20px',
              cursor: 'pointer',
              borderRadius: '30px',
              border: 'none',
              background: 'linear-gradient(45deg, #0083b0, #00d2ff)',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 6px 20px rgba(0,210,255,0.4)',
              marginTop: '15px'
            }}
          >
            Start Session
          </button>
        </div>
      )}

      {/* STEP 2: LIVE CAMERA STREAM WITH SIDEBAR PREVIEW */}
      {isCameraOpen && photos.length < targetPhotoCount && (
        <div style={{ marginTop: '20px' }}>
          {errorMsg ? (
            <p style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '20px', marginTop: '30px' }}>
              {errorMsg}
            </p>
          ) : (
            <div>
              {currentPhotoNum > 0 && (
                <h2 style={{ color: '#0083b0', marginBottom: '10px' }}>
                  Taking Photo {currentPhotoNum} of {targetPhotoCount}
                </h2>
              )}

              <div className="capture-layout">
                {/* CAMERA STREAM */}
                <div className="camera-section">
                  <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                    />

                    {/* ANIMATED COUNTDOWN EFFECT */}
                    {countdown !== null && (
                      <div className="countdown-animated">
                        {countdown}
                      </div>
                    )}
                  </div>
                </div>

                {/* SIDEBAR: RECENTLY CAPTURED PHOTOS */}
                <div className="sidebar-preview">
                  <p className="sidebar-title">Shots ({photos.length}/{targetPhotoCount})</p>
                  {photos.length === 0 ? (
                    <span style={{ fontSize: '12px', color: '#888', marginTop: '20px' }}>
                      Captured photos will appear here
                    </span>
                  ) : (
                    photos.map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo} 
                        alt={`Captured shot ${index + 1}`} 
                        className="thumb-img"
                      />
                    ))
                  )}
                </div>
              </div>

              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <br />

              <button
                onClick={startPhotoSequence}
                disabled={currentPhotoNum > 0}
                style={{
                  marginTop: '15px',
                  padding: '12px 28px',
                  fontSize: '18px',
                  cursor: currentPhotoNum > 0 ? 'not-allowed' : 'pointer',
                  borderRadius: '30px',
                  border: 'none',
                  backgroundColor: currentPhotoNum > 0 ? '#cccccc' : '#28a745',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {currentPhotoNum > 0 ? 'Capturing...' : `Start ${targetPhotoCount}-Photo Shoot`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: PREVIEW, FILTER, DESIGN & DOWNLOAD */}
      {photos.length === targetPhotoCount && (
        <div style={{ marginTop: '20px' }}>
          {/* FILTER OPTIONS */}
          <div className="option-group">
            <h3 style={{ margin: '0 0 10px 0', color: '#0083b0' }}>1. Photo Filter:</h3>
            {filterList.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`btn-option ${selectedFilter === filter.id ? 'active' : ''}`}
              >
                {filter.name}
              </button>
            ))}
          </div>

          {/* FRAME DESIGN STYLE OPTIONS */}
          <div className="option-group">
            <h3 style={{ margin: '0 0 10px 0', color: '#0083b0' }}>2. Frame Design Style:</h3>
            {frameDesignList.map((design) => (
              <button
                key={design.id}
                onClick={() => setFrameDesign(design.id)}
                className={`btn-option ${frameDesign === design.id ? 'active' : ''}`}
              >
                {design.name}
              </button>
            ))}
          </div>

          {/* FRAME COLOR OPTIONS */}
          <div className="option-group">
            <h3 style={{ margin: '0 0 10px 0', color: '#0083b0' }}>3. Frame Color:</h3>
            {frameColors.map((frame) => (
              <button
                key={frame.name}
                onClick={() => setFrameColor(frame.hex)}
                className={`btn-option ${frameColor === frame.hex ? 'active' : ''}`}
                style={{
                  backgroundColor: frame.hex,
                  color: frame.hex === '#111111' ? 'white' : '#0083b0',
                  border: frameColor === frame.hex ? '2px solid #0083b0' : '1px solid #ccc'
                }}
              >
                {frame.name}
              </button>
            ))}
          </div>

          <canvas ref={stripCanvasRef} style={{ display: 'none' }} />

          {stripImage && (
            <div>
              <h3>Your Custom Photobooth Strip:</h3>
              <div style={{ marginTop: '15px' }}>
                <img 
                  src={stripImage} 
                  alt="Photobooth Strip Preview" 
                  style={{
                    maxWidth: '320px',
                    borderRadius: '12px',
                    boxShadow: '0px 10px 30px rgba(0,0,0,0.3)'
                  }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <a 
                  href={stripImage} 
                  download="eri-photobooth-strip.png"
                  style={{
                    padding: '12px 28px',
                    fontSize: '16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(40,167,69,0.4)'
                  }}
                >
                  Download Photo Strip
                </a>

                <button
                  onClick={handleRetake}
                  style={{
                    padding: '12px 28px',
                    fontSize: '16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '30px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(220,53,69,0.4)'
                  }}
                >
                  Retake Photos
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;