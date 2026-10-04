import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Camera } from 'lucide-react';

function App() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(null);

  // USER CHOICES
  const [targetPhotoCount, setTargetPhotoCount] = useState(3);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [frameColor, setFrameColor] = useState('#ffffff');
  const [frameDesign, setFrameDesign] = useState('bows');

  const [photos, setPhotos] = useState([]);
  const [currentPhotoNum, setCurrentPhotoNum] = useState(0);
  const [stripImage, setStripImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stripCanvasRef = useRef(null);

  // CUSTOM SPECIFIED FILTERS
  const filterList = [
    { id: 'normal', name: 'Normal' },
    { id: 'soft', name: 'Soft' },
    { id: 'n10', name: 'N10' },
    { id: 'mellow', name: 'Mellow' },
    { id: 'brighten', name: 'Brighten' },
    { id: 'lumiskin', name: 'LumiSkin' },
    { id: 'bw', name: 'B&W' },
    { id: 'bright', name: 'Bright' }
  ];

  const frameColors = [
    { name: 'Classic White', hex: '#ffffff' },
    { name: 'Pitch Black', hex: '#111111' },
    { name: 'Baby Pink', hex: '#fce7f3' },
    { name: 'Pastel Lavender', hex: '#e9d5ff' },
    { name: 'Matcha Green', hex: '#dcfce7' },
    { name: 'Soft Cyan', hex: '#e0f7fa' }
  ];

  // STICKER FRAME DESIGNS
  const frameDesignList = [
    { id: 'bows', name: '🎀 Ribbon Bows' },
    { id: 'sparkles', name: '✨ Y2K Sparkles & Hearts' },
    { id: 'catpaws', name: '🐱 Cat Paws & Whiskers' },
    { id: 'cherries', name: '🍒 Cherries & Daisies' }
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

      // Mirror canvas transformation
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

  // CUSTOM PIXEL FILTERS ALGORITHM
  const applyMobilePixelFilter = (ctx, x, y, width, height, filterType) => {
    if (filterType === 'normal') return;

    const imgData = ctx.getImageData(x, y, width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (filterType === 'soft') {
        // Soft pastel glow
        data[i] = Math.min(255, r * 1.1 + 15);
        data[i + 1] = Math.min(255, g * 1.05 + 10);
        data[i + 2] = Math.min(255, b * 1.08 + 15);
      } else if (filterType === 'n10') {
        // Cool modern tone
        data[i] = Math.max(0, r * 0.95);
        data[i + 1] = Math.min(255, g * 1.05 + 5);
        data[i + 2] = Math.min(255, b * 1.18 + 15);
      } else if (filterType === 'mellow') {
        // Vintage warm muted
        data[i] = Math.min(255, r * 1.1 + 10);
        data[i + 1] = Math.min(255, g * 0.98 + 5);
        data[i + 2] = Math.max(0, b * 0.85);
      } else if (filterType === 'brighten') {
        // Lift exposure and brightness
        data[i] = Math.min(255, r * 1.15 + 20);
        data[i + 1] = Math.min(255, g * 1.15 + 20);
        data[i + 2] = Math.min(255, b * 1.15 + 20);
      } else if (filterType === 'lumiskin') {
        // Rosy skin glow effect
        data[i] = Math.min(255, r * 1.22 + 25);
        data[i + 1] = Math.min(255, g * 1.05 + 8);
        data[i + 2] = Math.min(255, b * 1.12 + 15);
      } else if (filterType === 'bw') {
        // Classic B&W
        const avg = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      } else if (filterType === 'bright') {
        // High saturation & vivid contrast
        data[i] = Math.min(255, r * 1.3);
        data[i + 1] = Math.min(255, g * 1.25);
        data[i + 2] = Math.min(255, b * 1.25);
      }
    }

    ctx.putImageData(imgData, x, y);
  };

  // DRAW LARGER & PROPORTIONAL STICKERS OVERLAY
  const drawStickerOverlay = (ctx, design, x, y, width, height) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (design === 'bows') {
      ctx.font = '40px serif';
      // Big Bows at top corners & top center
      ctx.fillText('🎀', x + 10, y + 10);
      ctx.fillText('🎀', x + width - 10, y + 10);
      ctx.fillText('🎀', x + width / 2, y - 10);

      // Pearl dots on sides
      ctx.fillStyle = '#ffb6c1';
      for (let py = y + 40; py < y + height - 20; py += 45) {
        ctx.beginPath();
        ctx.arc(x - 15, py, 5, 0, Math.PI * 2);
        ctx.arc(x + width + 15, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (design === 'sparkles') {
      ctx.font = '38px serif';
      ctx.fillText('💖', x - 5, y - 5);
      ctx.fillText('✨', x + width + 5, y - 5);
      ctx.fillText('✨', x - 5, y + height + 5);
      ctx.fillText('💖', x + width + 5, y + height + 5);
      ctx.fillText('⭐', x + width / 2, y - 12);
    } else if (design === 'catpaws') {
      ctx.font = '36px serif';
      ctx.fillText('🐾', x - 10, y + 25);
      ctx.fillText('🐾', x + width + 10, y + height - 25);
      ctx.fillText('🐱', x + width / 2, y - 10);
      ctx.fillText('🐾', x - 10, y + height - 25);
      ctx.fillText('🐾', x + width + 10, y + 25);
    } else if (design === 'cherries') {
      ctx.font = '38px serif';
      ctx.fillText('🍒', x - 5, y - 5);
      ctx.fillText('🌼', x + width + 5, y - 5);
      ctx.fillText('🌼', x - 5, y + height + 5);
      ctx.fillText('🍒', x + width + 5, y + height + 5);
      ctx.fillText('🌸', x + width / 2, y - 10);
    }
  };

  // CANVAS PHOTO STRIP GENERATION
  const generatePhotoStrip = () => {
    if (photos.length !== targetPhotoCount) return;

    const stripCanvas = stripCanvasRef.current;
    if (!stripCanvas) return;

    const ctx = stripCanvas.getContext('2d');

    const photoWidth = 400;
    const photoHeight = 300;
    const padding = 45; // Increased padding for big stickers
    const headerHeight = 30;
    const footerHeight = 85;

    const canvasWidth = photoWidth + (padding * 2);
    const canvasHeight = headerHeight + (photoHeight * targetPhotoCount) + (padding * (targetPhotoCount + 1)) + footerHeight;

    stripCanvas.width = canvasWidth;
    stripCanvas.height = canvasHeight;

    // 1. Base Frame Background
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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

            // Draw Inner Border / Shadow
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 8;
            ctx.fillRect(padding - 4, yPos - 4, photoWidth + 8, photoHeight + 8);
            ctx.shadowColor = 'transparent';

            // Draw Base Photo
            ctx.drawImage(photoImg, padding, yPos, photoWidth, photoHeight);

            // Apply Selected Pixel Filter
            applyMobilePixelFilter(ctx, padding, yPos, photoWidth, photoHeight, selectedFilter);

            // Draw Cute Stickers Overlay (Larger Size)
            drawStickerOverlay(ctx, frameDesign, padding, yPos, photoWidth, photoHeight);
          });

          // Footer Branding
          ctx.fillStyle = frameColor === '#111111' ? '#ffffff' : '#0083b0';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';

          const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          ctx.fillText('ERI PHOTOBOOTH', canvasWidth / 2, canvasHeight - 48);
          ctx.font = '13px monospace';
          ctx.fillText(`• ${dateStr} •`, canvasWidth / 2, canvasHeight - 22);

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
            Select shots count & start your photoshoot session!
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
                {currentPhotoNum > 0 ? (
                  'Capturing...'
                ) : (
                  <>
                  <Camera size={20} />
                  Start Capture
                  </>
                )}
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

          {/* STICKER FRAME DESIGN OPTIONS */}
          <div className="option-group">
            <h3 style={{ margin: '0 0 10px 0', color: '#0083b0' }}>2. Cute Sticker Frame Design:</h3>
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