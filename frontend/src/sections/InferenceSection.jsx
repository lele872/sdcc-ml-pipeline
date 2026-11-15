import {
  BulbOutlined,
  ClockCircleOutlined,
  CloudOutlined,
  FireOutlined,
  RadarChartOutlined,
  RobotOutlined,
  SoundOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { PrediciRequest, PrediciResponse } from '@common'
import {
  Alert,
  Button,
  Card,
  Col,
  message,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'
import { postJson } from '../api'
import Field from '../basic-ui/Field'
import Page from '../basic-ui/Page'
import PresetButton from '../basic-ui/PresetButton'

const PRESETS = {
  'Aula vuota': {
    S1_Temp: 24.9,
    S2_Temp: 24.8,
    S3_Temp: 24.7,
    S4_Temp: 25.0,
    S1_Light: 0,
    S2_Light: 0,
    S3_Light: 0,
    S4_Light: 0,
    S1_Sound: 0.05,
    S2_Sound: 0.05,
    S3_Sound: 0.05,
    S4_Sound: 0.05,
    S5_CO2: 430,
    S5_CO2_Slope: 0.0,
    S6_PIR: 0,
    S7_PIR: 0,
    Ora: 8,
    GiornoSettimana: 0,
  },
  'Lezione piena': {
    S1_Temp: 25.6,
    S2_Temp: 25.5,
    S3_Temp: 25.4,
    S4_Temp: 25.8,
    S1_Light: 120,
    S2_Light: 95,
    S3_Light: 110,
    S4_Light: 88,
    S1_Sound: 0.85,
    S2_Sound: 0.79,
    S3_Sound: 0.81,
    S4_Sound: 0.74,
    S5_CO2: 1290,
    S5_CO2_Slope: 1.8,
    S6_PIR: 1,
    S7_PIR: 1,
    Ora: 10,
    GiornoSettimana: 4,
  },
  'Studio tranquillo': {
    S1_Temp: 25.2,
    S2_Temp: 25.1,
    S3_Temp: 25.0,
    S4_Temp: 25.3,
    S1_Light: 45,
    S2_Light: 38,
    S3_Light: 50,
    S4_Light: 30,
    S1_Sound: 0.32,
    S2_Sound: 0.28,
    S3_Sound: 0.3,
    S4_Sound: 0.26,
    S5_CO2: 720,
    S5_CO2_Slope: 0.4,
    S6_PIR: 0,
    S7_PIR: 1,
    Ora: 15,
    GiornoSettimana: 2,
  },
  'Sera (buio)': {
    S1_Temp: 24.5,
    S2_Temp: 24.4,
    S3_Temp: 24.3,
    S4_Temp: 24.6,
    S1_Light: 0,
    S2_Light: 0,
    S3_Light: 0,
    S4_Light: 0,
    S1_Sound: 0.1,
    S2_Sound: 0.08,
    S3_Sound: 0.09,
    S4_Sound: 0.07,
    S5_CO2: 560,
    S5_CO2_Slope: -0.2,
    S6_PIR: 0,
    S7_PIR: 0,
    Ora: 21,
    GiornoSettimana: 5,
  },
}

const TEMP_PROPS = { min: 0, max: 50, step: 0.01 }
const LIGHT_PROPS = { min: 0, max: 1000, step: 1 }
const SOUND_PROPS = { min: 0, max: 5, step: 0.01 }
const PIR_PROPS = { min: 0, max: 1, step: 1 }
const CO2_PROPS = { min: 300, max: 5000, step: 1 }
const CO2_SLOPE_PROPS = { min: -10, max: 10, step: 0.1 }
const ORA_PROPS = { min: 0, max: 23, step: 1 }
const GIORNO_PROPS = { min: 0, max: 6, step: 1 }

const CLASSI = ['0', '1', '2', '3']
const COLORI_CLASSE = { 0: '#8c8c8c', 1: '#52c41a', 2: '#1677ff', 3: '#fa8c16' }

const GRUPPI = [
  {
    titolo: 'Temperatura',
    icona: <FireOutlined />,
    colore: '#faad14',
    campi: [
      ['S1_Temp', TEMP_PROPS],
      ['S2_Temp', TEMP_PROPS],
      ['S3_Temp', TEMP_PROPS],
      ['S4_Temp', TEMP_PROPS],
    ],
  },
  {
    titolo: 'Luce',
    icona: <BulbOutlined />,
    colore: '#fadb14',
    campi: [
      ['S1_Light', LIGHT_PROPS],
      ['S2_Light', LIGHT_PROPS],
      ['S3_Light', LIGHT_PROPS],
      ['S4_Light', LIGHT_PROPS],
    ],
  },
  {
    titolo: 'Suono',
    icona: <SoundOutlined />,
    colore: '#13c2c2',
    campi: [
      ['S1_Sound', SOUND_PROPS],
      ['S2_Sound', SOUND_PROPS],
      ['S3_Sound', SOUND_PROPS],
      ['S4_Sound', SOUND_PROPS],
    ],
  },
  {
    titolo: 'CO2',
    icona: <CloudOutlined />,
    colore: '#52c41a',
    campi: [
      ['S5_CO2', CO2_PROPS],
      ['S5_CO2_Slope', CO2_SLOPE_PROPS],
    ],
  },
  {
    titolo: 'Movimento PIR',
    icona: <RadarChartOutlined />,
    colore: '#eb2f96',
    campi: [
      ['S6_PIR', PIR_PROPS],
      ['S7_PIR', PIR_PROPS],
    ],
  },
  {
    titolo: 'Tempo',
    icona: <ClockCircleOutlined />,
    colore: '#1677ff',
    campi: [
      ['Ora', ORA_PROPS],
      ['GiornoSettimana', GIORNO_PROPS],
    ],
  },
]

export default function InferenceSection() {
  const [features, setFeatures] = useState({ ...PRESETS['Aula vuota'] })
  const [risultato, setRisultato] = useState(null)
  const [loading, setLoading] = useState(false)

  const setFeature = (nome) => (valore) => {
    setFeatures((f) => ({ ...f, [nome]: valore }))
  }

  const applicaPreset = (nome) => {
    setFeatures({ ...PRESETS[nome] })
    setRisultato(null)
  }

  const predici = async () => {
    const validazione = PrediciRequest.safeParse(features)
    if (!validazione.success) {
      message.error(
        `Dati non validi: ${validazione.error.issues[0].path.join('.')} ${validazione.error.issues[0].message}`,
      )
      return
    }
    setLoading(true)
    try {
      const data = PrediciResponse.parse(await postJson('/api/predici', validazione.data))
      setRisultato(data)
    } catch (_e) {
      message.error('Predizione non riuscita')
      setRisultato(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page
      title="Inferenza"
      subtitle="Stima quante persone ci sono in un'aula partendo dai sensori. Scegli uno scenario rapido qui sotto, oppure regola i valori a mano, poi premi PREDICI."
      azione={
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={predici}
          loading={loading}
          size="large"
          style={{
            background: '#2563eb',
            boxShadow: '0 0 20px rgba(37,99,235,0.35)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          PREDICI
        </Button>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Come funziona"
          description="Ogni gruppo di sensori descrive l'aula: temperatura (°C), luce (lux), suono (V), CO₂ (ppm), movimento (PIR: 0 = nessuno, 1 = rilevato) e orario. Il modello combina tutto e risponde con il numero di persone più probabile."
        />
        <Row gutter={[16, 16]}>
          {Object.keys(PRESETS).map((nome) => (
            <Col key={nome} xs={12} md={6}>
              <PresetButton label={nome} onApply={() => applicaPreset(nome)} block />
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]} align="stretch">
          {GRUPPI.map((gruppo) => (
            <Col key={gruppo.titolo} xs={24} sm={12} lg={8}>
              <Card
                size="small"
                style={{ height: '100%' }}
                title={
                  <span>
                    <span style={{ color: gruppo.colore, marginRight: 8 }}>{gruppo.icona}</span>
                    {gruppo.titolo}
                  </span>
                }
              >
                {gruppo.campi.map(([nome, props]) => (
                  <Field
                    key={nome}
                    nome={nome}
                    valore={features[nome]}
                    onChange={setFeature(nome)}
                    {...props}
                  />
                ))}
              </Card>
            </Col>
          ))}
        </Row>
        {risultato && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: 'rgba(7,7,8,0.92)',
              backdropFilter: 'blur(3px)',
              zIndex: 100,
            }}
          >
            <Typography.Title
              style={{
                fontSize: 96,
                margin: 0,
                lineHeight: 1.1,
                color: '#fff',
              }}
            >
              {risultato.persone_predette}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
              persone in aula secondo il modello
            </Typography.Text>
            <Tag icon={<RobotOutlined />} color="geekblue">
              Modello: {risultato.modello_usato}
            </Tag>
            {CLASSI.map((classe) => {
              const prob = risultato.probabilita_per_classe[classe] ?? 0
              return (
                <div key={classe} style={{ width: '100%', maxWidth: 480 }}>
                  <Statistic
                    title={
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {`${classe} ${classe === '1' ? 'persona' : 'persone'}`}
                      </span>
                    }
                    value={Math.round(prob * 100)}
                    suffix="%"
                    valueStyle={{ color: '#fff' }}
                  />
                  <Progress
                    percent={Math.round(prob * 100)}
                    strokeColor={COLORI_CLASSE[classe]}
                    showInfo={false}
                  />
                </div>
              )
            })}
            <Button
              type="primary"
              size="large"
              onClick={() => setRisultato(null)}
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: '#2563eb',
                boxShadow: '0 0 20px rgba(37,99,235,0.5)',
                fontWeight: 700,
                marginTop: 16,
              }}
            >
              Ripeti inferenza
            </Button>
          </div>
        )}
        {loading && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: 'rgba(7,7,8,0.92)',
              backdropFilter: 'blur(3px)',
              zIndex: 100,
            }}
          >
            <Spin size="large" />
            <Typography.Text
              style={{
                color: '#fff',
                fontSize: 13,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Il modello sta analizzando i sensori...
            </Typography.Text>
          </div>
        )}
      </Space>
    </Page>
  )
}
