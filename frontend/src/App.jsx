import {
  CloudServerOutlined,
  CloudUploadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { clearToken, getToken } from './api'
import InferenceSection from './sections/InferenceSection'
import LoginSection from './sections/LoginSection'
import LogsSection from './sections/LogsSection'
import UploadSection from './sections/UploadSection'

const SEZIONI = {
  '#/inferenza': { label: 'Inferenza', icona: <ExperimentOutlined /> },
  '#/upload': { label: 'Upload', icona: <CloudUploadOutlined /> },
  '#/logs': { label: 'Logs', icona: <FileTextOutlined /> },
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#/inferenza')
  const [collassata, setCollassata] = useState(false)
  const [mobileAperta, setMobileAperta] = useState(false)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/inferenza')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!getToken() && window.location.hash !== '#/login') {
      window.location.hash = '#/login'
      setHash('#/login')
    }
  }, [])

  useEffect(() => {
    if (hash === '#/login' && getToken()) {
      window.location.hash = '#/inferenza'
    }
  }, [hash])

  const vai = (h) => {
    window.location.hash = h
    setMobileAperta(false)
  }

  const logout = () => {
    clearToken()
    vai('#/login')
  }

  const sezioneAttiva = Object.keys(SEZIONI).includes(hash) ? hash : '#/inferenza'

  const contenuto = () => {
    if (hash === '#/upload') return <UploadSection />
    if (hash === '#/logs') return <LogsSection />
    return <InferenceSection />
  }

  const larghezza = collassata ? 80 : 240

  const voceMenu = ([percorso, s]) => {
    const attiva = sezioneAttiva === percorso
    return (
      <button
        type="button"
        key={percorso}
        onClick={() => vai(percorso)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          margin: '4px 10px',
          width: 'calc(100% - 20px)',
          borderRadius: 10,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 13,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          fontWeight: attiva ? 700 : 400,
          color: attiva ? '#fff' : 'rgba(255,255,255,0.55)',
          background: attiva ? 'rgba(37,99,235,0.15)' : 'transparent',
          border: attiva ? '1px solid rgba(37,99,235,0.4)' : '1px solid transparent',
          transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
        title={collassata ? s.label : undefined}
      >
        <span
          style={{
            fontSize: 16,
            color: attiva ? '#3b82f6' : 'rgba(255,255,255,0.45)',
            width: 20,
            flexShrink: 0,
            textAlign: 'center',
          }}
        >
          {s.icona}
        </span>
        <span style={{ opacity: collassata ? 0 : 1, transition: 'opacity 0.25s ease' }}>
          {s.label}
        </span>
      </button>
    )
  }

  if (hash === '#/login') {
    return <LoginSection />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      {mobileAperta && (
        <button
          type="button"
          aria-label="Chiudi menu"
          onClick={() => setMobileAperta(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            border: 'none',
            cursor: 'pointer',
          }}
        />
      )}
      <aside
        style={{
          position: 'fixed',
          zIndex: 50,
          top: 0,
          bottom: 0,
          left: 0,
          width: larghezza,
          background: '#0a0a0a',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 72,
            padding: '0 10px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              flexShrink: 0,
            }}
          >
            <CloudServerOutlined style={{ fontSize: 22, color: '#3b82f6' }} />
          </div>
          <Typography.Text
            strong
            style={{
              color: '#fff',
              fontSize: 15,
              maxWidth: collassata ? 0 : 120,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              opacity: collassata ? 0 : 1,
              transition: 'max-width 0.3s ease, opacity 0.25s ease',
            }}
          >
            SDCC ML
          </Typography.Text>
          <div style={{ flex: 1 }} />
          <Button
            type="text"
            size="small"
            onClick={() => setCollassata((c) => !c)}
            icon={
              collassata ? (
                <MenuUnfoldOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />
              ) : (
                <MenuFoldOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />
              )
            }
            style={{ flexShrink: 0 }}
          />
        </div>
        <nav style={{ flex: 1, paddingTop: 12, overflow: 'hidden' }}>
          {Object.entries(SEZIONI).map(voceMenu)}
        </nav>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <Avatar
            icon={<UserOutlined />}
            size={30}
            style={{ background: '#2563eb', flexShrink: 0 }}
          />
          <Typography.Text
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              maxWidth: collassata ? 0 : 100,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              opacity: collassata ? 0 : 1,
              transition: 'max-width 0.3s ease, opacity 0.25s ease',
            }}
          >
            admin
          </Typography.Text>
          <div style={{ flex: 1 }} />
          <Button
            type="text"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            title="Logout"
            style={{ flexShrink: 0 }}
          />
        </div>
      </aside>
      <main
        style={{
          flex: 1,
          marginLeft: larghezza,
          padding: 28,
          minHeight: '100vh',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {contenuto()}
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <Typography.Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            SDCC ML PIPELINE — EMULATO SU FLOCI
          </Typography.Text>
        </div>
      </main>
    </div>
  )
}
