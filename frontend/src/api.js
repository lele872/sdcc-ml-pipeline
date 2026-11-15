import { message } from 'antd'

const BASE_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:3001'

export function getToken() {
  return localStorage.getItem('sdcc_token')
}

export function setToken(token) {
  localStorage.setItem('sdcc_token', token)
}

export function clearToken() {
  localStorage.removeItem('sdcc_token')
}

async function request(path, options = {}) {
  const headers = options.headers || {}
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    message.warning('Sessione scaduta, effettua di nuovo il login')
    window.location.hash = '#/login'
    throw new Error('Non autorizzato')
  }
  return res
}

export async function getJson(path) {
  const res = await request(path)
  return res.json()
}

export async function postJson(path, body) {
  const res = await request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function postForm(path, formData) {
  const res = await request(path, {
    method: 'POST',
    body: formData,
  })
  return res.json()
}

export { BASE_URL }
