import nodemailer from 'nodemailer'
import type { LeadPayload } from './types'

function ensureTransport() {
  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || '465')
  const secure = String(process.env.EMAIL_SECURE || 'true') === 'true'
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS
  if (!host || !user || !pass) throw new Error('Missing EMAIL_* envs')
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

export function emailSubject(p: LeadPayload) {
  const city = (p.city || 'Unknown').trim()
  const name = (p.fullName || `${p.firstName || ''} ${p.lastName || ''}`).trim() || 'New Lead'
  const prop = p.propertyId ? ` — prop:${p.propertyId}` : ''
  return `[New Lead • ${city}] ${name}${prop}`
}

export function renderLeadText(p: LeadPayload & { score: number; assignedAgent?: any }) {
  return [
    `New lead from Crown Coastal Homes:`,
    ``,
    `Name: ${(p.fullName ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`).trim()}`,
    `Email: ${p.email ?? 'N/A'}`,
    `Phone: ${p.phone ?? 'N/A'}`,
    ``,
    `City/State/County: ${p.city ?? '-'} / ${p.state ?? '-'} / ${p.county ?? '-'}`,
    `Property: ${p.propertyId ?? '-'}`,
    `Page: ${p.pageUrl ?? '-'}`,
    ``,
    `Budget Max: ${p.budgetMax ?? '-'}`,
    `Timeframe: ${p.timeframe ?? '-'}`,
    `Wants Tour: ${p.wantsTour ? 'Yes' : 'No'}`,
    ``,
    `Score: ${p.score}  Assigned: ${p.assignedAgent ? p.assignedAgent.name : 'Unassigned'}`,
    `Tags: ${(p.tags ?? []).join(', ') || '-'}`,
    `Source: ${p.utm_source ?? p.source ?? '-'} / ${p.utm_medium ?? p.medium ?? '-'} / ${p.utm_campaign ?? p.campaign ?? '-'}`,
    `Referrer: ${p.referrer ?? p.referer ?? '-'}`,
    ``,
    `Message:`,
    `${p.message ?? '-'}`,
    ``,
    `Anti-bot: ms_on_page=${p.__top ?? 0} honeypot=${p.company ?? ''}`,
  ].join('\n')
}

function renderLeadHtml(p: LeadPayload & { score: number; assignedAgent?: any }) {
  const text = renderLeadText(p)
  const escaped = text.replace(/\n/g, '<br/>')
  return `<div style="font-family: Arial, sans-serif; white-space: pre-wrap">${escaped}</div>`
}

export async function sendLeadEmail(to: string, payload: LeadPayload & { score: number; assignedAgent?: any }) {
  const transporter = ensureTransport()
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER!
  const subject = emailSubject(payload)
  const text = renderLeadText(payload)
  const html = renderLeadHtml(payload)
  const cc: string[] = []
  if (payload.assignedAgent?.email) cc.push(payload.assignedAgent.email)
  const info = await transporter.sendMail({ from, to, cc: cc.length ? cc : undefined, subject, text, html })
  return info
}
