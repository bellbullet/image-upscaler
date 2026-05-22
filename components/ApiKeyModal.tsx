'use client';

import { useState, useEffect } from 'react';

interface Props {
  onSave: (key: string) => void;
  onClose: () => void;
  current?: string;
}

export default function ApiKeyModal({ onSave, onClose, current }: Props) {
  const [key, setKey] = useState(current ?? '');
  const [show, setShow] = useState(false);

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem('replicate_api_key', key.trim());
      onSave(key.trim());
      onClose();
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Replicate API Key</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <p className="modal-desc">
          高品質モードはReplicate APIを使用します。
          APIキーは<strong>お使いのブラウザにのみ保存</strong>され、サーバーには送信されません。
        </p>

        <a
          href="https://replicate.com/account/api-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="get-key-link"
        >
          → Replicateでキーを取得 ↗
        </a>

        <div className="input-wrap">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="r8_xxxxxxxxxxxxxxxxxxxx"
            className="key-input"
            autoFocus
          />
          <button
            className="toggle-show"
            onClick={() => setShow(!show)}
            type="button"
          >
            {show ? 'HIDE' : 'SHOW'}
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>キャンセル</button>
          <button className="btn-save" onClick={handleSave} disabled={!key.trim()}>
            保存して使用
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.15s ease;
          }
          .modal-box {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 28px;
            width: 480px;
            max-width: calc(100vw - 32px);
            animation: fadeIn 0.2s ease;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .modal-header h3 {
            font-family: var(--font-serif);
            font-size: 20px;
            color: var(--accent);
          }
          .close-btn {
            background: none;
            border: none;
            color: var(--muted);
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
          }
          .close-btn:hover { color: var(--text); }
          .modal-desc {
            font-size: 12px;
            color: var(--muted);
            line-height: 1.7;
            margin-bottom: 12px;
          }
          .modal-desc strong { color: var(--text); }
          .get-key-link {
            display: block;
            font-size: 11px;
            color: var(--accent);
            text-decoration: none;
            margin-bottom: 16px;
            letter-spacing: 0.05em;
          }
          .get-key-link:hover { text-decoration: underline; }
          .input-wrap {
            position: relative;
            margin-bottom: 20px;
          }
          .key-input {
            width: 100%;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 10px 60px 10px 12px;
            color: var(--text);
            font-family: var(--font-mono), monospace;
            font-size: 12px;
            outline: none;
            transition: border-color 0.2s;
          }
          .key-input:focus { border-color: var(--accent); }
          .toggle-show {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--muted);
            font-size: 10px;
            letter-spacing: 0.1em;
            cursor: pointer;
            padding: 4px;
          }
          .toggle-show:hover { color: var(--accent); }
          .modal-footer {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          .btn-cancel {
            background: none;
            border: 1px solid var(--border);
            color: var(--muted);
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
          }
          .btn-cancel:hover { border-color: var(--muted); color: var(--text); }
          .btn-save {
            background: var(--accent);
            border: none;
            color: #000;
            padding: 8px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            font-weight: 500;
            transition: background 0.2s;
          }
          .btn-save:hover:not(:disabled) { background: #f0a040; }
          .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        `}</style>
      </div>
    </div>
  );
}
