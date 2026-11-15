import { CloudServerOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Form, Input, message, Typography } from 'antd'
import { useState } from 'react'
import { postJson, setToken } from '../api'

export default function LoginSection() {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await postJson('/api/login', {
        username: values.username,
        password: values.password,
      })
      if (data.token) {
        setToken(data.token)
        message.success('Login effettuato')
        window.location.hash = '#/inferenza'
      } else {
        message.error(data.error || 'Credenziali non valide')
      }
    } catch (_e) {
      message.error('Errore di rete durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 380 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
          }}
        >
          <CloudServerOutlined style={{ fontSize: 42, color: '#3b82f6' }} />
          <Typography.Text
            strong
            style={{
              color: '#fff',
              fontSize: 18,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            SDCC ML
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Pipeline ML serverless — emulata su Floci
          </Typography.Text>
        </div>
        <div
          style={{
            background: '#101216',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 28,
          }}
        >
          <Form onFinish={onFinish} initialValues={{ username: 'admin', password: 'Admin123!' }}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Inserisci lo username' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Inserisci la password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                background: '#2563eb',
                boxShadow: '0 0 20px rgba(37,99,235,0.35)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Accedi
            </Button>
          </Form>
        </div>
      </div>
    </div>
  )
}
