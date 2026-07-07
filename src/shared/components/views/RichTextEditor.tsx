'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: string;
}

const COLORS = [
  '#1e293b', '#ef4444', '#f59e0b', '#10b981', '#1E88FF', '#8b5cf6',
  '#ec4899', '#64748b',
];

export default function RichTextEditor({ value, onChange, minHeight = '400px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isReady) {
      editorRef.current.innerHTML = value;
      setIsReady(true);
    }
  }, [value, isReady]);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text.replace(/\n/g, '<br>'));
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2px',
        padding: '6px 8px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface)',
        alignItems: 'center',
      }}>
        <ToolbarButton onClick={() => exec('bold')} title="Bold (Ctrl+B)" label="B" style={{ fontWeight: 700 }} />
        <ToolbarButton onClick={() => exec('italic')} title="Italic (Ctrl+I)" label="I" style={{ fontStyle: 'italic' }} />
        <ToolbarButton onClick={() => exec('underline')} title="Underline (Ctrl+U)" label="U" style={{ textDecoration: 'underline' }} />
        <Divider />
        <ToolbarButton onClick={() => exec('formatBlock', '<h3>')} title="Heading 3" label="H3" style={{ fontWeight: 700, fontSize: '13px' }} />
        <ToolbarButton onClick={() => exec('formatBlock', '<h4>')} title="Heading 4" label="H4" style={{ fontWeight: 600, fontSize: '12px' }} />
        <ToolbarButton onClick={() => exec('formatBlock', '<p>')} title="Paragraph" label="P" style={{ fontSize: '12px' }} />
        <Divider />
        <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Bullet List" label="• List" />
        <ToolbarButton onClick={() => exec('insertOrderedList')} title="Numbered List" label="1. List" />
        <Divider />
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <input
            type="color"
            onChange={(e) => exec('foreColor', e.target.value)}
            title="Text Color"
            style={{
              width: '28px', height: '28px', padding: 0, border: '1px solid var(--border-color)',
              borderRadius: '6px', cursor: 'pointer', background: 'none',
            }}
          />
        </div>
        <ToolbarButton onClick={insertLink} title="Insert Link" label="🔗" />
        <Divider />
        <ToolbarButton onClick={() => exec('undo')} title="Undo" label="↩" />
        <ToolbarButton onClick={() => exec('redo')} title="Redo" label="↪" />
        <Divider />
        <ToolbarButton
          onClick={() => {
            const html = editorRef.current?.innerHTML || '';
            if (html) {
              exec('selectAll');
              exec('delete');
              onChange('');
            }
          }}
          title="Clear All"
          label="✕"
          style={{ color: 'var(--danger)' }}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="legal-rich-text"
        style={{
          minHeight,
          padding: '16px 20px',
          fontSize: '14px',
          lineHeight: 1.75,
          color: 'var(--text-body)',
          outline: 'none',
          overflowY: 'auto',
          fontFamily: "'SF Mono', 'Fira Code', 'Segoe UI', sans-serif",
        }}
      />
    </div>
  );
}

function ToolbarButton({ onClick, title, label, style }: {
  onClick: () => void;
  title: string;
  label: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '4px 10px',
        borderRadius: '6px',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-body)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        lineHeight: 1,
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-color)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{
      width: '1px',
      height: '20px',
      background: 'var(--border-color)',
      margin: '0 4px',
      flexShrink: 0,
    }} />
  );
}
