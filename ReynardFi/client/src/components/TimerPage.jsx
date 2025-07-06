import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TimerPage = ({ initialTime }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft <= 0) {
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="timer-page" style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>📶 Piso WiFi</h1>
      <h2>Time Left</h2>
      <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '20px' }}>
        {formatTime(timeLeft)}
      </div>
      {timeLeft <= 0 && <p>Your time is up. Redirecting...</p>}
    </div>
  );
};

export default TimerPage;
