'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ComparisonSlider = dynamic(() => import('@/components/ComparisonSlider'), { ssr: false });
const ApiKeyModal = dynamic(() => import('@/components/ApiKeyModal'), { ssr: false });

type Engine = 'browser' | 'lightweight' | 'replicate';
type Status = 'idle' | 'loading-model' | 'upscaling' | 'done' | 'error';

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export default function Home() {
  const [engine, setEngine] = useState<Engine>('browser');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [scale, setScale] = useState<2 | 4>(4);
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [resultSrc, setResultSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('replicate_api_key');
    if (saved) setApiKey(saved);

    // スマホ判定して初期エンジンを自動設定
    const mobile = isMobile();
    setIsMobileDevice(mobile);
    if (mobile) setEngine('lightweight');
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalSrc(url);
    setResultSrc(null);
    setStatus('idle');
    setError(null);
    setProgress(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleUpscale = async () => {
    if (!originalSrc) return;
    if (engine === 'replicate') {
      if (!apiKey) { setShowApiModal(true); return; }
      await upscaleReplicate();
    } else if (engine === 'lightweight') {
      await upscaleLightweight();
    } else {
      await upscaleBrowser();
    }
  };

  // PC: UpscalerJS (ブラウザAI)
  const upscaleBrowser = async () => {
    if (!imgRef.current) return;
    setStatus('loading-model');
    setProgress(0);
    setError(null);
    try {
      const { upscaleInBrowser } = await import('@/lib/browserUpscale');
      setStatus('upscaling');
      const result = await upscaleInBrowser(imgRef.current, scale, (pct) => setProgress(pct));
      setResultSrc(result);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '処理に失敗しました');
      setStatus('error');
    }
  };

  // スマホ: サーバーside sharp (軽量)
  const upscaleLightweight = async () => {
    if (!imgRef.current) return;
    setStatus('upscaling');
    setProgress(15);
    setError(null);
    try {
      // canvasで直接base64取得（Safariのblob URL fetch問題を回避）
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');

      setProgress(40);

      const apiRes = await fetch('/api/upscale-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, scale }),
      });

      setProgress(85);
      const data = await apiRes.json();
      if (!apiRes.ok) throw new Error(data.error ?? 'Server error');

      setResultSrc(data.outputBase64);
      setProgress(100);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '処理に失敗しました');
      setStatus('error');
    }
  };

  // Replicate API
  const upscaleReplicate = async () => {
    if (!originalSrc) return;
    setStatus('upscaling');
    setProgress(10);
    setError(null);
    try {
      const res = await fetch(originalSrc);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      setProgress(30);

      const apiRes = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, scale, faceEnhance, apiKey }),
      });

      setProgress(80);
      const data = await apiRes.json();
      if (!apiRes.ok) throw new Error(data.error ?? 'API error');

      const outRes = await fetch(data.outputUrl);
      const outBlob = await outRes.blob();
      setResultSrc(URL.createObjectURL(outBlob));
      setProgress(100);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '処理に失敗しました');
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!resultSrc) return;
    const a = document.createElement('a');
    a.href = resultSrc;
    a.download = `reborn_${scale}x_${Date.now()}.png`;
    a.click();
  };

  const reset = () => {
    setOriginalSrc(null);
    setResultSrc(null);
    setStatus('idle');
    setError(null);
    setProgress(0);
  };

  const isProcessing = status === 'loading-model' || status === 'upscaling';

  const engines: { id: Engine; icon: string; name: string; desc: string; mobileOnly?: boolean; pcOnly?: boolean }[] = [
    {
      id: 'lightweight',
      icon: '📱',
      name: '軽量モード',
      desc: 'Lanczos3 補間 · サーバー処理 · 無料 · 高速',
    },
    {
      id: 'browser',
      icon: '🧠',
      name: 'ブラウザAI',
      desc: 'ESRGAN · PC推奨 · 無料 · 高品質AI',
      pcOnly: true,
    },
    {
      id: 'replicate',
      icon: '⚡',
      name: 'Replicate AI',
      desc: 'Real-ESRGAN · 最高品質 · APIキー必要',
    },
  ];

  return (
    <main>
      <header>
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">◈</span>
            <span className="logo-text">REBORN</span>
          </div>
          <p className="tagline">AI Image Upscaler — 古い写真に新たな命を</p>
          {isMobileDevice && (
            <span className="mobile-badge">📱 スマホ最適化済み</span>
          )}
        </div>
      </header>

      <div className="container">

        {/* Engine Selector */}
        <section className="section">
          <label className="section-label">ENGINE</label>
          <div className="engine-grid">
            {engines.map((eng) => (
              <button
                key={eng.id}
                className={`engine-card ${engine === eng.id ? 'active' : ''} ${eng.pcOnly && isMobileDevice ? 'disabled-card' : ''}`}
                onClick={() => {
                  if (eng.pcOnly && isMobileDevice) return;
                  setEngine(eng.id);
                }}
                title={eng.pcOnly && isMobileDevice ? 'スマホでは非推奨（クラッシュする場合があります）' : ''}
              >
                <span className="engine-icon">{eng.icon}</span>
                <div>
                  <div className="engine-name">
                    {eng.name}
                    {eng.pcOnly && <span className="pc-tag">PC推奨</span>}
                  </div>
                  <div className="engine-desc">{eng.desc}</div>
                </div>
                {engine === eng.id && <span className="engine-check">✓</span>}
                {eng.id === 'replicate' && engine === 'replicate' && (
                  <button
                    className="key-badge"
                    onClick={(e) => { e.stopPropagation(); setShowApiModal(true); }}
                  >
                    {apiKey ? '🔑 設定済' : '🔑 未設定'}
                  </button>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Options */}
        <section className="section options-row">
          <div className="option-group">
            <label className="section-label">SCALE</label>
            <div className="toggle-group">
              {([2, 4] as const).map((s) => (
                <button
                  key={s}
                  className={`toggle-btn ${scale === s ? 'active' : ''}`}
                  onClick={() => setScale(s)}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
          {engine === 'replicate' && (
            <div className="option-group">
              <label className="section-label">顔補正</label>
              <button
                className={`toggle-btn ${faceEnhance ? 'active' : ''}`}
                onClick={() => setFaceEnhance(!faceEnhance)}
              >
                {faceEnhance ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </section>

        {/* Upload Zone */}
        {!originalSrc ? (
          <section
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
            />
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="4" y="8" width="40" height="32" rx="3" />
                <circle cx="16" cy="19" r="4" />
                <path d="M4 34 L14 24 L22 32 L30 22 L44 34" />
                <path d="M24 4 L24 12 M20 8 L24 4 L28 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="upload-primary">画像をドロップ、またはタップして選択</p>
            <p className="upload-secondary">JPEG · PNG · WebP · BMP 対応</p>
          </section>
        ) : (
          <section className="preview-section">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={originalSrc} alt="" style={{ display: 'none' }} crossOrigin="anonymous" />

            {status === 'done' && resultSrc ? (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <ComparisonSlider before={originalSrc} after={resultSrc} />
                <div className="result-actions">
                  <button className="btn-secondary" onClick={reset}>別の画像</button>
                  <button className="btn-primary" onClick={handleDownload}>
                    ↓ ダウンロード ({scale}× 高解像度)
                  </button>
                </div>
              </div>
            ) : (
              <div className="preview-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalSrc} alt="Original" className="preview-img" />
                {isProcessing && (
                  <div className="progress-overlay">
                    <div className="progress-box">
                      <div className="spinner" />
                      <p className="progress-label">
                        {status === 'loading-model' ? 'AIモデル読み込み中...' : '超解像処理中...'}
                      </p>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="progress-pct">{progress}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="error-banner">
                <span>⚠</span> {error}
                {engine === 'replicate' && (
                  <button className="error-btn" onClick={() => setShowApiModal(true)}>APIキーを確認</button>
                )}
              </div>
            )}

            {(status === 'idle' || status === 'error') && (
              <div className="action-bar">
                <button className="btn-ghost" onClick={reset}>← 変更</button>
                <button className="btn-primary" onClick={handleUpscale}>
                  ◈ {scale}× 超解像を実行
                </button>
              </div>
            )}
          </section>
        )}

        {/* Info */}
        <section className="info-grid">
          <div className="info-card">
            <div className="info-icon">📱</div>
            <div className="info-text">
              <strong>スマホ自動最適化</strong>
              モバイルは軽量モードを自動選択。PCはブラウザAIが使えます
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">🎞</div>
            <div className="info-text">
              <strong>古い写真に最適</strong>
              プリント写真のスキャンも4倍まで鮮明に
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <div className="info-text">
              <strong>Real-ESRGAN対応</strong>
              Replicateモードで最高品質のAI超解像
            </div>
          </div>
        </section>
      </div>

      {showApiModal && (
        <ApiKeyModal
          current={apiKey}
          onSave={setApiKey}
          onClose={() => setShowApiModal(false)}
        />
      )}

      <style>{`
        main { min-height: 100vh; }
        header { border-bottom: 1px solid var(--border); padding: 20px 0; }
        .header-inner {
          max-width: 800px; margin: 0 auto; padding: 0 24px;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-mark { font-size: 24px; color: var(--accent); }
        .logo-text { font-family: var(--font-serif); font-size: 22px; color: var(--text); letter-spacing: 0.1em; }
        .tagline {
          font-size: 11px; color: var(--muted); letter-spacing: 0.05em;
          border-left: 1px solid var(--border); padding-left: 16px; margin: 0;
        }
        .mobile-badge {
          font-size: 10px; color: var(--accent); background: var(--accent-glow);
          border: 1px solid var(--accent-dim); border-radius: 20px; padding: 3px 10px;
          letter-spacing: 0.05em; margin-left: auto;
        }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 24px; display: flex; flex-direction: column; gap: 28px; }
        .section { animation: fadeIn 0.3s ease both; }
        .section-label { display: block; font-size: 10px; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 10px; }
        .engine-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 600px) { .engine-grid { grid-template-columns: 1fr; } }
        .engine-card {
          display: flex; align-items: center; gap: 12px;
          background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
          padding: 14px; cursor: pointer; text-align: left;
          transition: border-color 0.2s, background 0.2s; position: relative;
        }
        .engine-card:hover:not(.disabled-card) { border-color: var(--accent-dim); background: var(--surface-2); }
        .engine-card.active { border-color: var(--accent); background: var(--accent-glow); animation: pulse-glow 3s ease infinite; }
        .engine-card.disabled-card { opacity: 0.35; cursor: not-allowed; }
        .engine-icon { font-size: 20px; flex-shrink: 0; }
        .engine-name { font-size: 12px; color: var(--text); margin-bottom: 3px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .pc-tag { font-size: 9px; background: var(--surface-2); border: 1px solid var(--border); color: var(--muted); padding: 1px 5px; border-radius: 2px; letter-spacing: 0.05em; }
        .engine-desc { font-size: 10px; color: var(--muted); line-height: 1.4; }
        .engine-check { position: absolute; top: 10px; right: 10px; color: var(--accent); font-size: 12px; }
        .key-badge {
          position: absolute; bottom: 8px; right: 10px; font-size: 9px; color: var(--accent);
          background: none; border: 1px solid var(--accent-dim); border-radius: 2px;
          padding: 2px 6px; cursor: pointer; letter-spacing: 0.05em; font-family: inherit;
        }
        .key-badge:hover { background: var(--accent-glow); }
        .options-row { display: flex; gap: 28px; align-items: flex-start; flex-wrap: wrap; }
        .option-group { display: flex; flex-direction: column; gap: 8px; }
        .toggle-group { display: flex; gap: 6px; }
        .toggle-btn {
          background: var(--surface); border: 1px solid var(--border); color: var(--muted);
          border-radius: 4px; padding: 6px 16px; font-size: 12px; cursor: pointer;
          font-family: inherit; letter-spacing: 0.05em; transition: all 0.15s;
        }
        .toggle-btn:hover { border-color: var(--accent-dim); color: var(--text); }
        .toggle-btn.active { background: var(--accent); border-color: var(--accent); color: #000; }
        .upload-zone {
          border: 1px dashed var(--border); border-radius: 6px; padding: 60px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          cursor: pointer; transition: border-color 0.2s, background 0.2s; background: var(--surface);
        }
        .upload-zone:hover, .upload-zone.dragging { border-color: var(--accent); background: var(--accent-glow); }
        .upload-icon { color: var(--muted); margin-bottom: 4px; }
        .upload-primary { font-size: 13px; color: var(--text); margin: 0; }
        .upload-secondary { font-size: 10px; color: var(--muted); margin: 0; letter-spacing: 0.1em; }
        .preview-section { display: flex; flex-direction: column; gap: 16px; animation: fadeIn 0.3s ease; }
        .preview-wrap {
          position: relative; border: 1px solid var(--border); border-radius: 4px;
          overflow: hidden; background: var(--surface); max-height: 480px;
          display: flex; align-items: center; justify-content: center;
        }
        .preview-img { max-width: 100%; max-height: 480px; object-fit: contain; display: block; }
        .progress-overlay {
          position: absolute; inset: 0; background: rgba(11,11,11,0.85);
          display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);
        }
        .progress-box { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .spinner { width: 36px; height: 36px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .progress-label { font-size: 12px; color: var(--muted); margin: 0; letter-spacing: 0.05em; }
        .progress-bar-wrap { width: 200px; height: 2px; background: var(--border); border-radius: 1px; }
        .progress-bar-fill { height: 100%; background: var(--accent); border-radius: 1px; transition: width 0.3s ease; box-shadow: 0 0 8px var(--accent); }
        .progress-pct { font-size: 11px; color: var(--accent); margin: 0; }
        .result-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px; }
        .action-bar { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-primary {
          background: var(--accent); border: none; color: #000; padding: 10px 22px;
          border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 500;
          cursor: pointer; letter-spacing: 0.03em; transition: background 0.2s;
        }
        .btn-primary:hover { background: #f0a040; }
        .btn-secondary, .btn-ghost {
          background: none; border: 1px solid var(--border); color: var(--muted);
          padding: 10px 18px; border-radius: 4px; font-size: 12px; font-family: inherit;
          cursor: pointer; transition: all 0.15s;
        }
        .btn-secondary:hover, .btn-ghost:hover { border-color: var(--muted); color: var(--text); }
        .error-banner {
          background: rgba(232, 90, 58, 0.1); border: 1px solid rgba(232, 90, 58, 0.3);
          border-radius: 4px; padding: 10px 14px; font-size: 12px; color: var(--danger);
          display: flex; align-items: center; gap: 8px;
        }
        .error-btn { margin-left: auto; background: none; border: 1px solid var(--danger); color: var(--danger); font-size: 11px; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-family: inherit; }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px; animation: fadeIn 0.5s ease both; }
        @media (max-width: 560px) { .info-grid { grid-template-columns: 1fr; } }
        .info-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px; display: flex; gap: 10px; align-items: flex-start; }
        .info-icon { font-size: 18px; flex-shrink: 0; }
        .info-text { font-size: 11px; color: var(--muted); line-height: 1.6; }
        .info-text strong { display: block; color: var(--text); margin-bottom: 3px; font-size: 11px; }
      `}</style>
    </main>
  );
}
