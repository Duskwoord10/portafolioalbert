import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const [showRobot, setShowRobot] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [countdown, setCountdown] = useState(5); // ✅ 5 segundos
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Evita scroll mientras está el 404 fullscreen
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // ✅ Ajustado a 5 segundos total
    const robotTimer = setTimeout(() => setShowRobot(false), 3500);
    const fadeTimer = setTimeout(() => setFadeOut(true), 4200);
    const redirectTimer = setTimeout(() => navigate("/"), 5000);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearInterval(countdownInterval);
      clearTimeout(robotTimer);
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <section className={`not-found-section ${fadeOut ? "fade-out" : ""}`}>
      {showRobot && (
        <div className="robot-container" aria-hidden="true">
          <div className="robot">
            <div className="robot-antenna">
              <div className="antenna-ball"></div>
            </div>

            <div className="robot-head">
              <div className="robot-eyes">
                <div className="eye left-eye">
                  <div className="pupil"></div>
                </div>
                <div className="eye right-eye">
                  <div className="pupil"></div>
                </div>
              </div>
              <div className="robot-mouth"></div>
            </div>

            <div className="robot-body">
              <div className="body-light"></div>
              <div className="body-panel"></div>
            </div>

            <div className="robot-arms">
              <div className="arm left-arm"></div>
              <div className="arm right-arm"></div>
            </div>
          </div>

          <div className="robot-shadow"></div>

          <div className="speech-bubble">
            <p>Oops! Error 404</p>
          </div>
        </div>
      )}

      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-code">
            <span className="number-4">4</span>
            <span className="number-0">0</span>
            <span className="number-4-last">4</span>
          </div>

          <h1 className="error-title">Página no encontrada</h1>

          <p className="error-message">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>

          <div className="button-group">
            <Link to="/" className="btn-primary">
              Volver al inicio
            </Link>

            <button onClick={() => window.history.back()} className="btn-secondary">
              Regresar
            </button>
          </div>

          <p className="redirect-timer">
            Redirigiendo en{" "}
            <span className="countdown-number">{countdown}</span>{" "}
            {countdown === 1 ? "segundo" : "segundos"}...
          </p>
        </div>
      </div>
    </section>
  );
}
