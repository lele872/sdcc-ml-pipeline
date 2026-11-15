import { SyncOutlined } from '@ant-design/icons'
import {
  Badge,
  Button,
  Empty,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { getJson } from '../api'
import Card from '../basic-ui/Card'
import Page from '../basic-ui/Page'
import Sheet from '../basic-ui/Sheet'

const GRUPPI = [
  '/aws/lambda/sdcc-scan',
  '/aws/lambda/sdcc-preprocess',
  '/aws/lambda/sdcc-train',
  '/aws/lambda/sdcc-infer',
]

const esitoMessaggio = (msg) => {
  const m = (msg || '').toLowerCase()
  if (m.includes('approvato')) return 'approvato'
  if (m.includes('quarantena')) return 'quarantena'
  return null
}

export default function LogsSection() {
  const [gruppo, setGruppo] = useState(GRUPPI[0])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selezionato, setSelezionato] = useState(null)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getJson(`/api/logs?group=${encodeURIComponent(gruppo)}&limit=100`)
      setEvents(data.events || [])
    } catch (_e) {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [gruppo])

  useEffect(() => {
    carica()
  }, [carica])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(carica, 10000)
    return () => clearInterval(timer)
  }, [autoRefresh, carica])

  const filtrati = filtro
    ? events.filter((e) => (e.message || '').toLowerCase().includes(filtro.toLowerCase()))
    : events

  const colonne = [
    {
      title: 'Orario',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (ts) => (
        <Tooltip title={dayjs(ts).format('DD/MM/YYYY HH:mm:ss')}>
          <Typography.Text>{dayjs(ts).format('HH:mm:ss')}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: 'Esito',
      key: 'esito',
      width: 130,
      render: (_, record) => {
        const esito = esitoMessaggio(record.message)
        if (!esito) return null
        return esito === 'approvato' ? (
          <Badge status="success" text="approvato" />
        ) : (
          <Badge status="error" text="quarantena" />
        )
      },
    },
    {
      title: 'Messaggio',
      dataIndex: 'message',
      key: 'message',
      render: (msg) => (
        <Typography.Text code copyable style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
          {msg}
        </Typography.Text>
      ),
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
      width: 90,
      render: (s) => (s ? <Tag>{s}</Tag> : null),
    },
  ]

  return (
    <Page title="Logs" subtitle="La cronologia di ciò che ha fatto la pipeline: cosa ha scansionato ClamAV, quali file sono stati approvati o messi in quarantena, e i training completati.">
      <Card title="Filtri">
        <Space wrap size="middle">
          <Select value={gruppo} onChange={setGruppo} style={{ width: 320 }}>
            {GRUPPI.map((g) => (
              <Select.Option key={g} value={g}>
                {g}
              </Select.Option>
            ))}
          </Select>
          <Input.Search
            placeholder="Filtra per testo"
            allowClear
            onSearch={setFiltro}
            onChange={(e) => {
              if (!e.target.value) setFiltro('')
            }}
            style={{ width: 240 }}
          />
          <Switch
            checked={autoRefresh}
            onChange={setAutoRefresh}
            checkedChildren={<SyncOutlined spin={autoRefresh} />}
            unCheckedChildren="Auto 10s"
          />
          <Button icon={<SyncOutlined />} onClick={carica} loading={loading}>
            Aggiorna
          </Button>
        </Space>
      </Card>
      <Card title={`Eventi (${filtrati.length})`}>
        <Table
          dataSource={filtrati}
          columns={colonne}
          rowKey={(r, i) => `${r.timestamp}-${i}`}
          loading={loading}
          size="small"
          pagination={{ pageSize: 20 }}
          locale={{
            emptyText: <Empty description="Nessun evento per questo gruppo di log" />,
          }}
          onRow={(record) => ({ onClick: () => setSelezionato(record) })}
          rowClassName={() => 'riga-cliccabile'}
          style={{ cursor: 'pointer' }}
        />
      </Card>
      <Sheet aperto={!!selezionato} titolo="Dettaglio evento" onClose={() => setSelezionato(null)}>
        {selezionato && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">Orario</Typography.Text>
              <div>
                <Typography.Text>
                  {dayjs(selezionato.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                </Typography.Text>
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">Esito</Typography.Text>
              <div>
                {esitoMessaggio(selezionato.message) === 'approvato' ? (
                  <Badge status="success" text="approvato" />
                ) : esitoMessaggio(selezionato.message) === 'quarantena' ? (
                  <Badge status="error" text="quarantena" />
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                )}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">Stream</Typography.Text>
              <div>
                {selezionato.stream ? <Tag>{selezionato.stream}</Tag> : <Typography.Text type="secondary">—</Typography.Text>}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">Messaggio</Typography.Text>
              <div>
                {(() => {
                  try {
                    const obj = JSON.parse(selezionato.message)
                    return (
                      <pre
                        style={{
                          background: '#0a0a0a',
                          padding: 16,
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.08)',
                          overflow: 'auto',
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(obj, null, 2)}
                      </pre>
                    )
                  } catch (_e) {
                    return (
                      <Typography.Text code style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {selezionato.message}
                      </Typography.Text>
                    )
                  }
                })()}
              </div>
            </div>
          </Space>
        )}
      </Sheet>
    </Page>
  )
}
