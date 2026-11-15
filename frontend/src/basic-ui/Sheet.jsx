import { Drawer, Typography } from 'antd'

export default function Sheet({ aperto, titolo, onClose, children }) {
  return (
    <Drawer
      open={aperto}
      title={
        <Typography.Text
          style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}
          type="secondary"
        >
          {titolo}
        </Typography.Text>
      }
      onClose={onClose}
      placement="right"
      width={480}
      headerStyle={{
        background: '#101216',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
      contentStyle={{
        background: '#101216',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </Drawer>
  )
}
