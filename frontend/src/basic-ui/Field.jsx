import { Form, InputNumber, Typography } from 'antd'

export default function Field({ nome, valore, onChange, min, max, step }) {
  return (
    <Form.Item style={{ marginBottom: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        {nome}
      </Typography.Text>
      <InputNumber
        value={valore}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        style={{ width: '100%' }}
      />
    </Form.Item>
  )
}
