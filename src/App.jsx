import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { applyPincushionDistortion } from './utils/imageProcessing';

const ProgressBar = () => (
  <div className="progress-bar-container">
    <div className="progress-bar"></div>
    <p>분석 중...</p>
  </div>
);

function App() {
  const [image, setImageDataUrl] = useState(null);
  const [pincushionImage, setPincushionImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const processImage = useCallback(async (dataUrl) => {
    setIsLoading(true);
    setImageDataUrl(dataUrl);
    try {
      const distorted = await applyPincushionDistortion(dataUrl, 0.2); // Adjust strength as needed
      setPincushionImage(distorted);
    } catch (error) {
      console.error("Error applying pincushion distortion:", error);
      setPincushionImage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processImage(event.target.result);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setShowCamera(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      processImage(dataUrl);
      setShowCamera(false);
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="App-header">
        <h1>진짜 내 얼굴을 찾아보세요</h1>
        <p>거울 속의 내 얼굴과 남이 보는 내 얼굴은 다릅니다.</p>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="button dark-mode-toggle">
          {isDarkMode ? '라이트 모드' : '다크 모드'}
        </button>
      </header>
      <main>
        {isLoading && <ProgressBar />}
        {!showCamera && !isLoading && (
          <div className="controls">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              id="file-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="button">
              사진 업로드
            </label>
            <button onClick={startCamera} className="button">
              카메라로 촬영
            </button>
          </div>
        )}
        {showCamera && !isLoading && (
          <div className="camera-container">
            <video ref={videoRef} autoPlay style={{ width: '100%', maxWidth: '500px', transform: 'scaleX(-1)' }}></video>
            <button onClick={handleCapture} className="button capture-button">
              촬영하기
            </button>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </div>
        )}
        <div className="image-container">
          {image && !isLoading && (
            <>
              <div className="image-wrapper">
                <h2>원본 (남들이 보는 내 얼굴)</h2>
                {pincushionImage ? (
                  <img src={pincushionImage} alt="Pincushion Distorted" />
                ) : (
                  <img src={image} alt="Original" />
                )}
              </div>
              <div className="image-wrapper">
                <h2>거울 속 내 얼굴</h2>
                <img
                  src={image}
                  alt="Mirrored"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
