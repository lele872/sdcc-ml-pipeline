import { InboxOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Alert, Button, message, Space, Steps, Typography, Upload } from 'antd'
import { useState } from 'react'
import { postForm } from '../api'
import Card from '../basic-ui/Card'
import Page from '../basic-ui/Page'

const MAX_SIZE = 50 * 1024 * 1024

const PIPELINE = [
  { title: 'Scansione antivirus ClamAV', description: 'automatico' },
  { title: 'Preprocessing dati', description: 'automatico' },
  { title: 'Training modello', description: 'automatico' },
  { title: 'Notifica email', description: 'automatico' },
]

export default function UploadSection() {
  const [esito, setEsito] = useState(null)

  const validaFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.error('Solo file .csv sono accettati')
      return false
    }
    if (file.size > MAX_SIZE) {
      message.error('Il file supera i 50MB consentiti')
      return false
    }
    return true
  }

  const inviaFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const data = await postForm('/api/upload', formData)
      setEsito({ ok: true, data })
      message.success(`File caricato: pipeline avviata (${data.key})`)
    } catch (_e) {
      setEsito({ ok: false })
      message.error('Caricamento fallito: riprova o controlla i logs')
    }
  }

  const uploadProps = {
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      if (validaFile(file)) {
        inviaFile(file)
      }
      return false
    },
  }

  return (
    <Page
      title="Upload dataset"
      subtitle="Carica qui il dataset CSV: da solo partirà tutta la pipeline (scansione antivirus, pulizia dati, training del modello). A fine training arriva un'email di notifica."
    >
      <Card title="File CSV">
        <Upload.Dragger {...uploadProps} style={{ padding: '32px 0' }}>
          <p className="ant-upload-drag-icon" style={{ fontSize: 56 }}>
            <InboxOutlined />
          </p>
          <p className="ant-upload-text" style={{ fontSize: 18 }}>
            Trascina qui il file CSV oppure clicca per selezionarlo
          </p>
          <p className="ant-upload-hint">
            Il file viene salvato su S3, scansionato con ClamAV e avvia la pipeline di training
          </p>
          <p className="ant-upload-hint">Massimo 50MB, solo estensione .csv</p>
        </Upload.Dragger>
      </Card>
      {esito && (
        <Card title="Esito">
          {esito.ok ? (
            <>
              <Alert
                type="success"
                message="File accettato"
                description={
                  <Space direction="vertical" size={4}>
                    <span>Scansione antivirus e pipeline avviate automaticamente.</span>
                    <Typography.Text type="secondary">
                      Il progresso dei passaggi è visibile nella sezione Logs.
                    </Typography.Text>
                  </Space>
                }
                showIcon
                icon={<SafetyCertificateOutlined />}
              />
              <Steps
                direction="vertical"
                size="small"
                current={-1}
                style={{ marginTop: 16 }}
                items={PIPELINE}
              />
            </>
          ) : (
            <Alert type="error" message="Caricamento fallito" showIcon />
          )}
        </Card>
      )}
    </Page>
  )
}
