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
    { name: 'Original', css: 'none' },
    { name: 'Grayscale', css: 'grayscale(100%)' },
    { name: 'B&W Drama', css: 'grayscale(100%) contrast(200%)' },
    { name: 'Sepia', css: 'sepia(100%)' },
    { name: 'Vintage', css: 'sepia(50%) contrast(120%) brightness(90%)' },
    { name: 'Bright', css: 'brightness(130%)' },
    { name: 'Contrast', css: 'contrast(160%)' },
    { name: 'Warm Glow', css: 'sepia(30%) saturate(140%) brightness(105%)' },
    { name: 'Cool Blue', css: 'hue-rotate(180deg) saturate(120%)' },
    { name: 'Cyberpunk', css: 'hue-rotate(280deg) saturate(200%) contrast(130%)' },
    { name: 'Pastel', css: 'saturate(80%) brightness(115%) hue-rotate(340deg)' },
    { name: 'Vivid', css: 'saturate(250%)' }
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
      setErrorMsg('Hindi mabuksan ang camera. Siguraduhing pinayagan (Allow) mo ang camera permission.');
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const context = canvas.getContext('2d');
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

  // CANVAS PHOTO STRIP GENERATION
  const generatePhotoStrip = () => {
    if (photos.length !== targetPhotoCount) return;

    const stripCanvas = stripCanvasRef.current;
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

            // Polaroid Border Option Extra Spacing
            if (frameDesign === 'polaroid') {
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(0,0,0,0.2)';
              ctx.shadowBlur = 10;
              ctx.fillRect(padding - 8, yPos - 8, photoWidth + 16, photoHeight + 16);
              ctx.shadowColor = 'transparent';
            }

            ctx.save();
            ctx.filter = selectedFilter;
            ctx.drawImage(photoImg, padding, yPos, photoWidth, photoHeight);
            ctx.restore();

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

      {/* STEP 2: LIVE CAMERA STREAM WITH ANIMATED TIMER */}
      {isCameraOpen && photos.length < targetPhotoCount && (
        <div style={{ marginTop: '20px' }}>
          {errorMsg ? (
            <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</p>
          ) : (
            <div>
              {currentPhotoNum > 0 && (
                <h2 style={{ color: '#0083b0', marginBottom: '10px' }}>
                  Taking Photo {currentPhotoNum} of {targetPhotoCount}
                </h2>
              )}

              <div style={{ position: 'relative', display: 'inline-block' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{
                    width: '90%',
                    maxWidth: '520px',
                    borderRadius: '16px',
                    border: '5px solid #0083b0',
                    boxShadow: '0 8px 25px rgba(0,131,176,0.3)'
                  }}
                />

                {/* ANIMATED COUNTDOWN EFFECT */}
                {countdown !== null && (
                  <div className="countdown-animated">
                    {countdown}
                  </div>
                )}
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

              <p style={{ marginTop: '10px', fontSize: '16px', color: '#555' }}>
                Captured: <strong>{photos.length} / {targetPhotoCount}</strong>
              </p>
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
                key={filter.name}
                onClick={() => setSelectedFilter(filter.css)}
                className={`btn-option ${selectedFilter === filter.css ? 'active' : ''}`}
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

              {/* ACTION BUTTONS (CLEAN TEXT, NO EMOJIS) */}
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