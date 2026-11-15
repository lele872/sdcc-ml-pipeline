import { Typography } from 'antd'

export default function Page({ title, subtitle, azione, children }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#3b82f6',
            boxShadow: '0 0 12px rgba(59,130,246,0.8)',
          }}
        />
        <Typography.Text
          strong
          style={{
            color: '#fff',
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}
        >
          {title}
        </Typography.Text>
        <div style={{ flex: 1 }} />
        {azione}
      </div>
      {subtitle && (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {subtitle}
        </Typography.Text>
      )}
      <div style={{ marginTop: 24 }}>{children}</div>
    </div>
  )
}
