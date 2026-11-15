import { Tag } from 'antd'

const COLORS = {
  success: 'green',
  error: 'red',
  neutral: 'default',
}

export default function Badge({ stato, testo }) {
  return (
    <Tag color={COLORS[stato] || 'default'} style={{ borderRadius: 8 }}>
      {testo || stato}
    </Tag>
  )
}
