import { z } from 'zod'

export const LoginRequest = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const LoginResponse = z.object({
  token: z.string().min(1),
})

export const MeResponse = z.object({
  username: z.string(),
  exp: z.number().int().positive(),
})

export const PrediciRequest = z.object({
  S1_Temp: z.number(),
  S2_Temp: z.number(),
  S3_Temp: z.number(),
  S4_Temp: z.number(),
  S1_Light: z.number(),
  S2_Light: z.number(),
  S3_Light: z.number(),
  S4_Light: z.number(),
  S1_Sound: z.number(),
  S2_Sound: z.number(),
  S3_Sound: z.number(),
  S4_Sound: z.number(),
  S5_CO2: z.number(),
  S5_CO2_Slope: z.number(),
  S6_PIR: z.number().int().min(0).max(1),
  S7_PIR: z.number().int().min(0).max(1),
  Ora: z.number().int().min(0).max(23),
  GiornoSettimana: z.number().int().min(0).max(6),
})

export const PrediciResponse = z.object({
  persone_predette: z.number().int().min(0),
  modello_usato: z.string(),
  probabilita_per_classe: z.record(z.number()),
})

export const UploadResponse = z.object({
  key: z.string().min(1),
})

export const LogEvent = z.object({
  timestamp: z.number(),
  message: z.string(),
  stream: z.string(),
})

export const LogsResponse = z.object({
  events: z.array(LogEvent),
})

export const ErrorResponse = z.object({
  error: z.string(),
})

export type LoginRequestDto = z.infer<typeof LoginRequest>
export type LoginResponseDto = z.infer<typeof LoginResponse>
export type MeResponseDto = z.infer<typeof MeResponse>
export type PrediciRequestDto = z.infer<typeof PrediciRequest>
export type PrediciResponseDto = z.infer<typeof PrediciResponse>
export type UploadResponseDto = z.infer<typeof UploadResponse>
export type LogsResponseDto = z.infer<typeof LogsResponse>
