import { Card as AntCard, Typography } from 'antd'

export default function Card({ title, children, style, hoverable = false }) {
  return (
    <AntCard
      hoverable={hoverable}
      style={{
        marginBottom: 16,
        background: '#101216',
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        ...style,
      }}
      styles={{
        header: { borderBottomColor: 'rgba(255,255,255,0.06)', background: 'transparent' },
      }}
      title={
        <Typography.Text
          strong
          type="secondary"
          style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 11 }}
        >
          {title}
        </Typography.Text>
      }
    >
      {children}
    </AntCard>
  )
}
