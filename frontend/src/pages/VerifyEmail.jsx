import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

function AnimatedStatus({ status }) {
  if (status !== 'success' && status !== 'error') return null;

  const isSuccess = status === 'success';
  const title = isSuccess ? 'Verified' : 'Verification failed';
  const subtitle = isSuccess
    ? 'Your email is confirmed. You can continue to login.'
    : 'The code is invalid or expired. Try again or resend a new code.';

  return (
    <div className={`veStatus ${isSuccess ? 'ok' : 'bad'}`}>
      <div className="veIcon" aria-hidden="true">
        {isSuccess ? (
          <svg viewBox="0 0 64 64" className="veSvg">
            <circle className="veCircle" cx="32" cy="32" r="24" />
            <path className="veCheck" d="M20 33.5l7 7L44.5 23" />
          </svg>
        ) : (
          <svg viewBox="0 0 64 64" className="veSvg">
            <circle className="veCircle" cx="32" cy="32" r="24" />
            <path className="veX" d="M23 23l18 18M41 23L23 41" />
          </svg>
        )}
      </div>
      <div className="veStatusText">
        <div className="veStatusTitle">{title}</div>
        <div className="veStatusSub">{subtitle}</div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [redirectIn, setRedirectIn] = useState(null);

  useEffect(() => {
    setEmail(params.get('email') || '');
  }, [params]);

  useEffect(() => {
    if (status !== 'success') {
      setRedirectIn(null);
      return;
    }

    setRedirectIn(10);

    const intervalId = setInterval(() => {
      setRedirectIn((v) => {
        if (typeof v !== 'number') return v;
        return v - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (redirectIn === 0) {
      const redirect = params.get('next') || params.get('redirect') || '/';
      nav(redirect);
    }
  }, [redirectIn, nav, params]);

  function onCodeChange(v) {
    const digits = (v || '').replace(/\D/g, '').slice(0, 6);
    setCode(digits);
  }

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setStatus('idle');
    setVerifying(true);
    try {
      const res = await api.verifyEmail({ email, code });
      setStatus('success');
      setMessage(res?.data?.detail || 'Email verified successfully.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    setMessage('');
    setStatus('idle');
    setResending(true);
    try {
      const res = await api.resendVerificationEmail({ email });
      setStatus('info');
      setMessage(res?.data?.detail || 'Verification code sent.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="pageCard veCard" style={{ width: 'min(560px, 100%)' }}>
        <div className="veHeader">
          <div>
            <div className="sectionTitle" style={{ fontSize: 18, marginBottom: 4 }}>Email verification</div>
            <div className="sectionHint">Enter the 6-digit code sent to your email.</div>
          </div>
          <div className={`vePulseDot ${verifying ? 'on' : ''}`} aria-hidden="true" />
        </div>

        <AnimatedStatus status={status} />

        <form onSubmit={submit} className="veForm">
          <div className="field">
            <div className="label">Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={verifying || status === 'success'}
            />
          </div>

          <div className="field">
            <div className="label">Verification code</div>
            <input
              className={`input veCodeInput ${status === 'error' ? 'veInputError' : ''}`}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={verifying || status === 'success'}
            />
            <div className="veCodeHint">Tip: you can paste the code — we’ll format it.</div>
          </div>

          {message ? (
            <div className={`veMessage ${status}`}>
              {message}
            </div>
          ) : null}

          {status !== 'success' ? (
            <button className="btn btnPrimary" type="submit" style={{ width: '100%' }} disabled={verifying || !email || code.length !== 6}>
              {verifying ? (
                <span className="veBtnRow">
                  <span className="veSpinner" aria-hidden="true" />
                  <span>Verifying...</span>
                </span>
              ) : (
                'Verify email'
              )}
            </button>
          ) : null}

          {status !== 'success' ? (
            <button className="btn" type="button" style={{ width: '100%', marginTop: 10 }} onClick={resend} disabled={resending || !email || verifying}>
              {resending ? (
                <span className="veBtnRow">
                  <span className="veSpinner" aria-hidden="true" />
                  <span>Sending...</span>
                </span>
              ) : (
                'Resend code'
              )}
            </button>
          ) : null}
        </form>

        {status === 'success' ? (
          <>
            {typeof redirectIn === 'number' ? (
              <div className="veCodeHint" style={{ textAlign: 'center', marginTop: 10 }}>
                Redirecting to home in {redirectIn}s...
              </div>
            ) : null}
            <Link className="btn btnPrimary" to="/login" style={{ width: '100%', display: 'inline-block', textAlign: 'center', marginTop: 10 }}>
              Continue to login
            </Link>
          </>
        ) : null}

        {status === 'error' ? (
          <div className="veFooterRow">
            <Link className="btn" to="/login" style={{ flex: 1, textAlign: 'center' }}>
              Back to login
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
