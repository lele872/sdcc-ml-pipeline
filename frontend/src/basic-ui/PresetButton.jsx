import { Button } from 'antd'

export default function PresetButton({ label, icon, onApply, block = false }) {
  return (
    <Button
      block={block}
      icon={icon}
      onClick={() => onApply()}
      style={{
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </Button>
  )
}
