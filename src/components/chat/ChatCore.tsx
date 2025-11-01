// "use client"
// import React, {
//   useCallback,
//   useEffect,
//   useImperativeHandle,
//   useMemo,
//   useRef,
//   useState,
//   forwardRef,
// } from "react"
// import { PropertyCards } from "../PropertyCards"
// import { ChatMessageRenderer } from "../chat/ChatMessageRenderer"
// import type { ChatUISpec } from "@/lib/ui-spec"
// import { stripBasicMarkdownArtifacts } from "@/lib/sanitize"

// type ChatCoreProps = {
//   defaultLang?: string
//   initialOpen?: boolean
//   propertyId?: string
//   propertySnapshot?: any
//   autoplayVoice?: boolean
//   hideHeader?: boolean
//   speakEnabled?: boolean
//   onSpeakEnabledChange?: (v: boolean) => void
//   onCallStateChange?: (s: { callOn: boolean; seconds: number }) => void
// }

// type ChatMsg = { from: "user" | "bot"; text: string }

// export type ChatCoreHandle = {
//   startCall: () => Promise<void>
//   endCall: () => void
//   toggleCall: () => Promise<void>
//   getState: () => { callOn: boolean; seconds: number }
// }

// export const ChatCore = forwardRef<ChatCoreHandle, ChatCoreProps>(function ChatCore(props, ref) {
//   const defaultLang = props.defaultLang || "en"
//   const [msg, setMsg] = useState("")
//   const [log, setLog] = useState<ChatMsg[]>([])
//   const [cards, setCards] = useState<any[]>([])
//   const [uiSpec, setUiSpec] = useState<ChatUISpec | null>(null)
//   const [isThinking, setIsThinking] = useState(false)
//   const [showIndicator, setShowIndicator] = useState(false) // delayed mount + min visible
//   const listRef = useRef<HTMLDivElement | null>(null)
//   const indicatorTimers = useRef<{ delay?: number; min?: number }>({})
//   const [speakEnabledUncontrolled, setSpeakEnabledUncontrolled] = useState(!!props.autoplayVoice)
//   const speakEnabled = props.speakEnabled ?? speakEnabledUncontrolled
//   const setSpeakEnabled = props.onSpeakEnabledChange ?? setSpeakEnabledUncontrolled

//   const session = useMemo(() => {
//     if (typeof window === "undefined") return crypto.randomUUID()
//     const key = "cc_session"
//     const existing = window.localStorage.getItem(key)
//     if (existing) return existing
//     const id = crypto.randomUUID()
//     window.localStorage.setItem(key, id)
//     return id
//   }, [])

//   const [isSending, setIsSending] = useState(false)

//   // ====== Audio (TTS) control ======
//   const audioRef = useRef<HTMLAudioElement | null>(null)
//   const currentAudioUrlRef = useRef<string | null>(null)
//   const ttsPlayingRef = useRef(false)

//   const stopAudio = () => {
//     try {
//       if (audioRef.current) {
//         audioRef.current.pause()
//         audioRef.current.currentTime = 0
//       }
//       if (currentAudioUrlRef.current) {
//         URL.revokeObjectURL(currentAudioUrlRef.current)
//         currentAudioUrlRef.current = null
//       }
//       ttsPlayingRef.current = false
//       try {
//         const mr = mediaRecorderRef.current
//         if (mr && callOnRef.current && mr.state === "paused") mr.resume()
//       } catch {}
//     } catch {}
//   }

//   const speak = async (text: string) => {
//     if (!speakEnabled || !text) return
//     stopAudio()
//     try {
//       const r = await fetch("/api/voice/tts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text, voice: "alloy" }),
//       })
//       const blob = await r.blob()
//       const url = URL.createObjectURL(blob)
//       currentAudioUrlRef.current = url
//       const a = new Audio(url)
//       audioRef.current = a
//       a.onplay = () => {
//         ttsPlayingRef.current = true
//         try {
//           const mr = mediaRecorderRef.current
//           if (mr && mr.state === "recording") mr.pause()
//         } catch {}
//       }
//       const clearTts = () => {
//         ttsPlayingRef.current = false
//         try {
//           const mr = mediaRecorderRef.current
//           if (mr && callOnRef.current && mr.state === "paused") mr.resume()
//         } catch {}
//       }
//       a.onended = clearTts
//       a.onpause = clearTts
//       a.play().catch(() => {})
//     } catch {}
//   }

//   useEffect(() => {
//     if (!speakEnabled) stopAudio()
//   }, [speakEnabled])

//   // ====== Chat send (text & voice) ======
//   const sendToChat = useCallback(
//     async (text: string) => {
//       const t = (text || "").trim()
//       if (!t) return
//       setLog((l) => [...l, { from: "user", text: t }])
//       // Begin thinking with delay and minimum visible time
//       try {
//         setIsThinking(true)
//         // show after 200ms
//         indicatorTimers.current.delay && clearTimeout(indicatorTimers.current.delay)
//         indicatorTimers.current.delay = window.setTimeout(() => setShowIndicator(true), 200)
//       } catch {}
//       try {
//         const body: any = {
//           message: t,
//           session_id: session,
//           lang: defaultLang,
//         }
//         if (props.propertyId) body.property_id = props.propertyId
//         if (props.propertySnapshot) body.property_snapshot = props.propertySnapshot
//         const r = await fetch("/api/chat", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(body),
//         })
//         setUiSpec(null)

//         const ct = r.headers.get("Content-Type") || ""
//         if (ct.includes("application/json")) {
//           const json = await r.json()
//           // complete
//           setIsThinking(false)
//           if (json && json.version === "1.0" && Array.isArray(json.blocks)) {
//             setUiSpec(json as ChatUISpec)
//             // Optional: add a lightweight confirmation message
//             setLog((l) => [...l, { from: "bot", text: "Here are contact options." }])
//           } else {
//             const answer: string = json.answer || ""
//             setLog((l) => [...l, { from: "bot", text: answer }])
//             if (json.result?.items) setCards(json.result.items)
//             if (speakEnabled) speak(answer)
//           }
//           return
//         }

//         // Stream text/plain
//         if (ct.includes("text/plain") && r.body) {
//           // while streaming, keep thinking on; it will stop after stream ends
//           const reader = r.body.getReader()
//           const decoder = new TextDecoder()
//           let acc = ""
//           let botIndex = -1
//           setLog((l) => {
//             const next = l.slice()
//             botIndex = next.length
//             next.push({ from: "bot", text: "" })
//             return next
//           })
//           while (true) {
//             const { done, value } = await reader.read()
//             if (done) break
//             const chunk = decoder.decode(value)
//             acc += chunk
//             const cleaned = stripBasicMarkdownArtifacts(acc)
//             setLog((l) => {
//               const next = l.slice()
//               if (botIndex >= 0 && next[botIndex]) next[botIndex] = { from: "bot", text: cleaned }
//               return next
//             })
//           }
//           setIsThinking(false)
//           if (speakEnabled) speak(acc)
//           return
//         }

//         // Fallback: try JSON
//         try {
//           const json = await r.json()
//           setIsThinking(false)
//           const answer: string = json.answer || ""
//           setLog((l) => [...l, { from: "bot", text: answer }])
//           if (json.result?.items) setCards(json.result.items)
//           if (speakEnabled) speak(answer)
//         } catch {
//           const textResp = await r.text()
//           setIsThinking(false)
//           const cleaned = stripBasicMarkdownArtifacts(textResp)
//           setLog((l) => [...l, { from: "bot", text: cleaned }])
//           if (speakEnabled) speak(cleaned)
//         }
//       } catch {
//         setLog((l) => [...l, { from: "bot", text: "Sorry, something went wrong." }])
//         setIsThinking(false)
//       }
//     },
//     [defaultLang, props.propertyId, props.propertySnapshot, session, speakEnabled]
//   )

//   const send = useCallback(async () => {
//     if (!msg.trim() || isSending) return
//     setIsSending(true)
//     const text = msg
//     setMsg("")
//     try {
//       await sendToChat(text)
//     } finally {
//       setIsSending(false)
//     }
//   }, [msg, isSending, sendToChat])

//   // Programmatic send hook: listen for app-wide event used by ChatWidget bus
//   useEffect(() => {
//     const onExternalSend = (e: Event) => {
//       const text = (e as CustomEvent<{ text: string }>).detail?.text ?? ""
//       const t = String(text || "").trim()
//       if (!t) return
//       // Enqueue without touching local input state
//       ;(async () => {
//         try { await sendToChat(t) } catch {}
//       })()
//     }
//     window.addEventListener("cc-chatcore-send" as any, onExternalSend as any)
//     return () => window.removeEventListener("cc-chatcore-send" as any, onExternalSend as any)
//   }, [sendToChat])

//   const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault()
//       send()
//     }
//   }

//   // Manage delayed show and minimum 1s visibility, with smooth fade-out
//   useEffect(() => {
//     if (isThinking) {
//       // ensure we keep min visible once shown
//       if (showIndicator) {
//         indicatorTimers.current.min && clearTimeout(indicatorTimers.current.min)
//         indicatorTimers.current.min = window.setTimeout(() => {
//           // allow hide after 1s
//         }, 1000)
//       }
//     } else {
//       // thinking finished; if indicator is visible, keep for >=1s
//       if (showIndicator) {
//         // If no min timer exists, create one for 1s before hiding
//         const hide = () => setShowIndicator(false)
//         if (indicatorTimers.current.min) {
//           const t = window.setTimeout(hide, 150) // small fade buffer
//           indicatorTimers.current.min = undefined
//           indicatorTimers.current.delay && clearTimeout(indicatorTimers.current.delay)
//           indicatorTimers.current.delay = undefined
//           return () => clearTimeout(t)
//         } else {
//           const t = window.setTimeout(() => setShowIndicator(false), 1000)
//           return () => clearTimeout(t)
//         }
//       } else {
//         // not visible yet; cancel pending delay
//         indicatorTimers.current.delay && clearTimeout(indicatorTimers.current.delay)
//         indicatorTimers.current.delay = undefined
//       }
//     }
//     return () => {}
//   }, [isThinking, showIndicator])

//   // Auto-scroll to bottom when thinking or new messages
//   useEffect(() => {
//     const el = listRef.current
//     if (!el) return
//     el.scrollTop = el.scrollHeight
//   }, [log, showIndicator])

//   // ====== Call mode (mic + STT) ======
//   const [callOn, setCallOn] = useState(false)
//   const [callSeconds, setCallSeconds] = useState(0)
//   const callTimerRef = useRef<number | null>(null)
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null)
//   const mediaStreamRef = useRef<MediaStream | null>(null)
//   const sttProcessingRef = useRef(false)
//   const lastChunkRef = useRef<Blob | null>(null)
//   const headerChunkRef = useRef<Blob | null>(null)
//   const [speakingActive, setSpeakingActive] = useState(false)
//   const currentUtteranceRef = useRef<string>("")
//   const lastAppendRef = useRef<string>("")
//   const lastSttAtRef = useRef<number>(0)
//   const speakingActiveRef = useRef(false)
//   const callOnRef = useRef(false)
//   useEffect(() => { speakingActiveRef.current = speakingActive }, [speakingActive])
//   useEffect(() => { callOnRef.current = callOn }, [callOn])
//   useEffect(() => { if (speakingActive) stopAudio() }, [speakingActive])

//   useEffect(() => {
//     const id = setTimeout(() => {
//       props.onCallStateChange?.({ callOn, seconds: callSeconds })
//     }, 0)
//     return () => clearTimeout(id)
//   }, [callOn, callSeconds, props])

//   const getBestMime = () => {
//     const candidates = [
//       "audio/webm;codecs=opus",
//       "audio/webm",
//       "audio/ogg;codecs=opus",
//       "audio/ogg",
//       "audio/mp4",
//     ]
//     for (const c of candidates) {
//       try {
//         // @ts-ignore
//         if (typeof (window as any).MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c
//       } catch {}
//     }
//     return undefined
//   }

//   // ====== STT Prompt & Filters ======
//   function buildSttPrompt() {
//     return [
//       "You are transcribing a real-estate buyer conversation.",
//       "Ignore TV/radio/YouTube outros like 'Thank you for watching', 'Like and subscribe', and Korean news phrases like 'MBC 뉴스'.",
//       "Prefer English unless the speaker clearly uses another language.",
//       "Focus on actionable intent like 'I need to buy properties in California'.",
//     ].join(" ")
//   }

//   function isLikelyForeignForEnglish(text: string): boolean {
//     const t = text || ""
//     const nonLatin = (t.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
//     const totalLetters = (t.match(/[A-Za-z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
//     if (totalLetters === 0) return false
//     return nonLatin / totalLetters > 0.4
//   }

//   const BANNED_REGEX: RegExp[] = [
//     /thanks? for watching/gi,
//     /thank you for watching/gi,
//     /like and subscribe/gi,
//     /share this video/gi,
//     /subscribe( to| on)? (the )?channel/gi,
//     /hit the bell/gi,
//     /smash that like/gi,
//     /\bmbc\b/gi,
//     /뉴스/gi,               // Korean "news"
//     /이학수입니다/gi,        // common Korean sign-off
//     /이덕영입니다/gi,
//   ]
//   const OFF_TOKENS = ["video", "channel", "podcast", "watching"]

//   function stripBannedPhrases(s: string) {
//     let t = s
//     for (const re of BANNED_REGEX) t = t.replace(re, " ")
//     // Collapse whitespace
//     return t.replace(/\s{2,}/g, " ").trim()
//   }

//   function isLikelyUnrelated(text: string): boolean {
//     const t = text.trim().toLowerCase()
//     if (!t) return true
//     const words = t.split(/\s+/).filter(Boolean).length
//     if (t.length < 6 || words < 2) return true
//     const offHits = OFF_TOKENS.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
//     if (offHits >= 2) return true
//     return false
//   }

//   function sanitizeTranscriptForSend(raw: string) {
//     // 1) Remove banned phrases inside mixed sentences
//     let t = stripBannedPhrases(raw)
//     if (!t) return ""

//     // 2) Split into sentences; keep likely-relevant English (if defaultLang='en')
//     const sentences = t.split(/(?<=[.!?])\s+|[\n\r]+/).map(s => s.trim()).filter(Boolean)
//     const kept = sentences.filter(s =>
//       !isLikelyUnrelated(s) &&
//       !(defaultLang === "en" && isLikelyForeignForEnglish(s))
//     )

//     // 3) If nothing left, fallback to the longest fragment after stripping banned
//     if (!kept.length) {
//       const fragments = t.split(/[.!?\n\r]+/).map(s => s.trim()).filter(Boolean)
//       const longest = fragments.sort((a, b) => b.length - a.length)[0] || ""
//       return longest
//     }

//     // 4) Rejoin and tidy capitalization for a nice one-liner
//     let out = kept.join(" ").replace(/\s{2,}/g, " ").trim()
//     if (defaultLang === "en" && out) {
//       out = out[0].toUpperCase() + out.slice(1)
//       if (!/[.!?]$/.test(out)) out += "."
//     }
//     return out
//   }

//   async function waitForQuiet(idleMs = 900, maxMs = 1600) {
//     try { mediaRecorderRef.current?.requestData() } catch {}
//     const start = Date.now()
//     let lastMark = lastSttAtRef.current
//     while (Date.now() - start < maxMs) {
//       const quietEnough = Date.now() - lastSttAtRef.current >= idleMs && !sttProcessingRef.current
//       if (quietEnough) return
//       if (lastMark !== lastSttAtRef.current) lastMark = lastSttAtRef.current
//       await new Promise((r) => setTimeout(r, 110))
//     }
//   }

//   const processChunk = useCallback(
//     async (blob: Blob) => {
//       if (!blob || blob.size === 0) return
//       if (ttsPlayingRef.current) return
//       if (sttProcessingRef.current) { lastChunkRef.current = blob; return }
//       sttProcessingRef.current = true
//       try {
//         const fd = new FormData()
//         const file = new File([blob], "chunk.webm", { type: "audio/webm" })
//         fd.append("audio", file)
//         fd.append("lang", defaultLang)
//         fd.append("prompt", buildSttPrompt())
//         const r = await fetch("/api/voice/stt", { method: "POST", body: fd }).then((r) => r.json())
//         const raw = String(r?.text || "").trim()
//         if (!callOnRef.current || !raw) {
//           // ignore
//         } else {
//           // Strip banned phrases INSIDE mixed chunks so we can still keep useful bits
//           let usable = stripBannedPhrases(raw)
//           if (!usable) {
//             // nothing left
//           } else if (isLikelyUnrelated(usable)) {
//             // background-y
//           } else if (defaultLang === "en" && isLikelyForeignForEnglish(usable)) {
//             // mostly non-Latin when we expect English
//           } else if (speakingActiveRef.current) {
//             if (usable !== lastAppendRef.current) {
//               currentUtteranceRef.current = (currentUtteranceRef.current + " " + usable).trim()
//               lastAppendRef.current = usable
//               lastSttAtRef.current = Date.now()
//             }
//           }
//         }
//       } catch {
//         // ignore per-chunk STT errors
//       } finally {
//         sttProcessingRef.current = false
//         if (lastChunkRef.current) {
//           const next = lastChunkRef.current
//           lastChunkRef.current = null
//           processChunk(next)
//         }
//       }
//     },
//     [defaultLang]
//   )

//   const startCall = useCallback(async () => {
//     if (callOn) return
//     try {
//       if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
//         alert("Microphone not available.")
//         return
//       }
//       stopAudio()

//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           autoGainControl: true,
//           channelCount: 1,
//         } as MediaTrackConstraints,
//       })
//       mediaStreamRef.current = stream
//       const mime = getBestMime()
//       const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
//       mediaRecorderRef.current = mr
//       mr.ondataavailable = (ev: BlobEvent) => {
//         const chunk = ev.data
//         if (!chunk || chunk.size === 0) return
//         if (!headerChunkRef.current) { headerChunkRef.current = chunk; return }
//         const mimeType = mr.mimeType || "audio/webm"
//         const assembled = new Blob([headerChunkRef.current, chunk], { type: mimeType })
//         processChunk(assembled)
//       }
//       // slice ~800–1000ms for latency vs. cost
//       mr.start(850)

//       setCallOn(true)
//       setSpeakingActive(true)
//       setTimeout(() => setSpeakEnabled(true), 0)

//       setCallSeconds(0)
//       if (callTimerRef.current) window.clearInterval(callTimerRef.current)
//       callTimerRef.current = window.setInterval(() => setCallSeconds((s) => s + 1), 1000)
//     } catch {
//       alert("Microphone not available.")
//     }
//   }, [callOn, setSpeakEnabled, processChunk])

//   const endCall = useCallback(() => {
//     if (!callOn) return
//     try { mediaRecorderRef.current?.stop() } catch {}
//     try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
//     mediaRecorderRef.current = null
//     mediaStreamRef.current = null
//     sttProcessingRef.current = false
//     lastChunkRef.current = null
//     headerChunkRef.current = null
//     setSpeakingActive(false)
//     currentUtteranceRef.current = ""
//     lastAppendRef.current = ""
//     if (callTimerRef.current) { window.clearInterval(callTimerRef.current); callTimerRef.current = null }
//     setCallOn(false)
//     stopAudio()
//   }, [callOn])

//   const toggleCall = useCallback(async () => {
//     if (callOn) endCall()
//     else await startCall()
//   }, [callOn, startCall, endCall])

//   useImperativeHandle(
//     ref,
//     () => ({
//       startCall,
//       endCall,
//       toggleCall,
//       getState: () => ({ callOn, seconds: callSeconds }),
//     }),
//     [startCall, endCall, toggleCall, callOn, callSeconds]
//   )

//   useEffect(() => () => {
//     stopAudio()
//     try { mediaRecorderRef.current?.stop() } catch {}
//     try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
//     if (callTimerRef.current) window.clearInterval(callTimerRef.current)
//   }, [])

//   // Load last session (logged-in users only)
//   useEffect(() => {
//     let cancelled = false
//     ;(async () => {
//       try {
//         const r = await fetch('/api/chat/session', { method: 'GET' })
//         if (!r.ok) return
//         const { messages } = await r.json()
//         if (cancelled || !Array.isArray(messages) || !messages.length) return
//         // Reconstruct a minimal view: show text turns and the last UI spec if any
//         const textTurns: { from: 'user' | 'bot'; text: string }[] = []
//         let lastSpec: any = null
//         for (const m of messages) {
//           const role = m.role
//           const content = m.content
//           if (content && typeof content === 'object' && content.version === '1.0') {
//             lastSpec = content
//           } else if (content && typeof content === 'object' && typeof content.text === 'string') {
//             if (role === 'user' || role === 'assistant') textTurns.push({ from: role === 'user' ? 'user' : 'bot', text: content.text })
//           } else if (typeof content === 'string') {
//             if (role === 'user' || role === 'assistant') textTurns.push({ from: role === 'user' ? 'user' : 'bot', text: content })
//           }
//         }
//         if (textTurns.length) setLog(textTurns)
//         if (lastSpec) setUiSpec(lastSpec)
//       } catch {}
//     })()
//     return () => { cancelled = true }
//   }, [])

//   // Handle load more requests from PropertyResults
//   useEffect(() => {
//     const handler = (e: any) => {
//       const detail = e?.detail || {}
//       const nextPage = Number(detail.page || 2)
//       const rawQuery = String(detail.rawQuery || '')
//       if (rawQuery) {
//         // Re-send the same query text; server will use page param
//         // Note: we include page in body by embedding it into the message format
//         // The server reads body.page as well if client sets it explicitly.
//         ;(async () => {
//           const body: any = { message: rawQuery, session_id: session, lang: defaultLang, page: nextPage }
//           const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
//           const ct = r.headers.get('Content-Type') || ''
//           if (ct.includes('application/json')) {
//             const json = await r.json()
//             if (json?.version === '1.0') setUiSpec(json)
//           }
//         })().catch(() => {})
//       }
//     }
//     window.addEventListener('cc-chat-load-more' as any, handler as any)
//     return () => window.removeEventListener('cc-chat-load-more' as any, handler as any)
//   }, [defaultLang, session])

//   // ====== UI ======
//   return (
//     <div className="flex flex-col h-full min-h-0">
//       {!props.hideHeader && (
//         <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
//           <div className="font-semibold">Crown Coastal AI</div>
//           <div className="flex items-center gap-2">
//             {callOn && (
//               <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
//                 ● Connected {String(Math.floor(callSeconds / 60)).padStart(2, "0")}:{String(callSeconds % 60).padStart(2, "0")}
//               </span>
//             )}
//             <button
//               type="button"
//               className={`text-sm px-2 py-1 rounded ${speakEnabled ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}
//               onClick={() => { if (speakEnabled) stopAudio(); setSpeakEnabled(!speakEnabled) }}
//               aria-label="Toggle voice replies"
//               title="Toggle voice replies"
//             >
//               🔊
//             </button>
//             <button
//               type="button"
//               onClick={() => toggleCall()}
//               className={`text-sm px-2 py-1 rounded ${callOn ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"}`}
//               aria-label={callOn ? "End call" : "Start call"}
//               title={callOn ? "End call" : "Start call"}
//             >
//               {callOn ? "End" : "🎤"}
//             </button>
//           </div>
//         </div>
//       )}

//       <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-white">
//         {log.map((m, i) => (
//           <div key={i} className={m.from === "user" ? "text-right" : ""}>
//             <div className={`inline-block px-3 py-2 rounded-lg ${m.from === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"}`}>
//               {m.text}
//             </div>
//           </div>
//         ))}
//         {showIndicator && (
//           <div className="flex items-start">
//             <div className="inline-block px-3 py-2 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800/80 dark:text-gray-100 transition-opacity duration-200">
//               {/* three dots */}
//               <div className="flex items-center space-x-1">
//                 <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
//                 <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
//                 <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce" />
//               </div>
//             </div>
//           </div>
//         )}
//         {uiSpec && (
//           <div className="pt-2">
//             <ChatMessageRenderer spec={uiSpec} />
//           </div>
//         )}
//         {cards.length > 0 && (
//           <div className="pt-2" data-cc-one-col={props.hideHeader ? "1" : undefined}>
//             <PropertyCards items={cards} />
//           </div>
//         )}
//         {props.hideHeader ? (
//           <style jsx global>{`
//             [data-cc-one-col] .grid { grid-template-columns: 1fr !important; }
//           `}</style>
//         ) : null}
//       </div>

//   <div className="sticky bottom-0 z-10 p-3 border-t bg-white text-gray-900">
//         {callOn && (
//           <div className="mb-2 flex justify-end">
//             <button
//               type="button"
//               onClick={async () => {
//                 if (speakingActive) {
//                   // Stopping: drain last chunk, sanitize, send
//                   setSpeakingActive(false)
//                   await waitForQuiet(900, 1600)
//                   const finalRaw = currentUtteranceRef.current.trim()
//                   currentUtteranceRef.current = ""
//                   lastAppendRef.current = ""
//                   const cleaned = sanitizeTranscriptForSend(finalRaw)
//                   if (cleaned) await sendToChat(cleaned)
//                 } else {
//                   // Starting again: cut any bot audio, clear buffer, resume
//                   stopAudio()
//                   currentUtteranceRef.current = ""
//                   lastAppendRef.current = ""
//                   setSpeakingActive(true)
//                 }
//               }}
//               className={`text-xs px-3 py-1 rounded ${speakingActive ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}
//               aria-label={speakingActive ? "Stop speaking" : "Start speaking"}
//               title={speakingActive ? "Stop speaking" : "Start speaking"}
//             >
//               {speakingActive ? "Stop speaking" : "Start speaking"}
//             </button>
//           </div>
//         )}
//         <div className="flex gap-2">
//           <input
//             className="flex-1 border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500"
//             value={msg}
//             onChange={(e) => setMsg(e.target.value)}
//             onKeyDown={onKeyDown}
//             placeholder="Ask about homes, listings, or viewings..."
//             aria-label="Chat input"
//           />
//           <button
//             onClick={send}
//             disabled={isSending}
//             className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
//             aria-label="Send"
//           >
//             Send
//           </button>
//           <button
//             onClick={() => toggleCall()}
//             className={`px-3 py-2 rounded-lg border ${callOn ? "bg-red-50 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-gray-700"}`}
//             aria-label={callOn ? "End call" : "Start call"}
//             title={callOn ? "End call" : "Start call"}
//           >
//             {callOn ? "End" : "🎤"}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// })

// /*
// Key fixes:
// - Pause mic while TTS plays (prevents "self-hearing").
// - Strip banned phrases (YouTube outros, MBC 뉴스, etc.) INSIDE mixed chunks.
// - Sanitize final utterance before sending to chat (keeps buyer intent, drops noise).
// - Sticky input preserved.
// */











































// "use client"
// import React, {
//   useCallback,
//   useEffect,
//   useImperativeHandle,
//   useMemo,
//   useRef,
//   useState,
//   forwardRef,
// } from "react"
// import { PropertyCards } from "../PropertyCards"
// import { ChatMessageRenderer } from "../chat/ChatMessageRenderer"
// import type { ChatUISpec } from "@/lib/ui-spec"
// import { stripBasicMarkdownArtifacts } from "@/lib/sanitize"

// type ChatCoreProps = {
//   defaultLang?: string
//   propertyId?: string
//   propertySnapshot?: any
//   autoplayVoice?: boolean
//   hideHeader?: boolean
//   speakEnabled?: boolean
//   onSpeakEnabledChange?: (v: boolean) => void
//   onCallStateChange?: (s: { callOn: boolean; seconds: number }) => void
// }

// type ChatMsg = { from: "user" | "bot"; text: string }

// export type ChatCoreHandle = {
//   startCall: () => Promise<void>
//   endCall: () => void
//   toggleCall: () => Promise<void>
//   getState: () => { callOn: boolean; seconds: number }
// }

// export const ChatCore = forwardRef<ChatCoreHandle, ChatCoreProps>(function ChatCore(
//   props,
//   ref
// ) {
//   const defaultLang = props.defaultLang || "en"
//   const [msg, setMsg] = useState("")
//   const [log, setLog] = useState<ChatMsg[]>([])
//   const [cards, setCards] = useState<any[]>([])
//   const [uiSpec, setUiSpec] = useState<ChatUISpec | null>(null)
//   const [isThinking, setIsThinking] = useState(false)
//   const [showIndicator, setShowIndicator] = useState(false)
//   const listRef = useRef<HTMLDivElement | null>(null)
//   const indicatorTimers = useRef<{ delay?: number; min?: number }>({})
//   const [suggestions, setSuggestions] = useState<string[]>([]) // quick replies

//   // voice toggle (controlled or uncontrolled)
//   const [speakEnabledUncontrolled, setSpeakEnabledUncontrolled] = useState(
//     !!props.autoplayVoice
//   )
//   const speakEnabled = props.speakEnabled ?? speakEnabledUncontrolled
//   const setSpeakEnabled =
//     props.onSpeakEnabledChange ?? setSpeakEnabledUncontrolled

//   // sticky session id
//   const session = useMemo(() => {
//     if (typeof window === "undefined") return crypto.randomUUID()
//     const key = "cc_session"
//     const existing = window.localStorage.getItem(key)
//     if (existing) return existing
//     const id = crypto.randomUUID()
//     window.localStorage.setItem(key, id)
//     return id
//   }, [])

//   const [isSending, setIsSending] = useState(false)

//   // ====== TTS playback (mini-player UI state) ======
//   const audioRef = useRef<HTMLAudioElement | null>(null)
//   const currentAudioUrlRef = useRef<string | null>(null)
//   const ttsPlayingRef = useRef(false)
//   const [ttsState, setTtsState] = useState<"idle" | "playing" | "paused">("idle")

//   const stopAudio = () => {
//     try {
//       if (audioRef.current) {
//         audioRef.current.pause()
//         audioRef.current.currentTime = 0
//       }
//       if (currentAudioUrlRef.current) {
//         URL.revokeObjectURL(currentAudioUrlRef.current)
//         currentAudioUrlRef.current = null
//       }
//       ttsPlayingRef.current = false
//       setTtsState("idle")
//       try {
//         const mr = mediaRecorderRef.current
//         if (mr && callOnRef.current && mr.state === "paused") mr.resume()
//       } catch {}
//     } catch {}
//   }

//   const toggleAudio = () => {
//     const a = audioRef.current
//     if (!a) return
//     if (a.paused) {
//       a.play().catch(() => {})
//     } else {
//       a.pause()
//     }
//   }

//   const speak = async (text: string) => {
//     if (!speakEnabled || !text) return
//     stopAudio()
//     try {
//       const r = await fetch("/api/voice/tts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text, voice: "alloy" }),
//       })
//       const blob = await r.blob()
//       const url = URL.createObjectURL(blob)
//       currentAudioUrlRef.current = url
//       const a = new Audio(url)
//       audioRef.current = a
//       a.onplay = () => {
//         ttsPlayingRef.current = true
//         setTtsState("playing")
//         try {
//           const mr = mediaRecorderRef.current
//           if (mr && mr.state === "recording") mr.pause()
//         } catch {}
//       }
//       const clearTts = () => {
//         ttsPlayingRef.current = false
//         setTtsState("idle")
//         try {
//           const mr = mediaRecorderRef.current
//           if (mr && callOnRef.current && mr.state === "paused") mr.resume()
//         } catch {}
//       }
//       a.onpause = () => setTtsState("paused")
//       a.onended = clearTts
//       a.play().catch(() => {})
//     } catch {}
//   }

//   useEffect(() => {
//     if (!speakEnabled) stopAudio()
//   }, [speakEnabled])

//   // ====== Send to chat (text or voice) ======
//   const sendToChat = useCallback(
//     async (text: string) => {
//       const t = (text || "").trim()
//       if (!t) return
//       setSuggestions([]) // hide quick replies after first interaction
//       setLog((l) => [...l, { from: "user", text: t }])

//       try {
//         setIsThinking(true)
//         // show typing badge after 200ms, keep visible >= 1s
//         indicatorTimers.current.delay &&
//           clearTimeout(indicatorTimers.current.delay)
//         indicatorTimers.current.delay = window.setTimeout(
//           () => setShowIndicator(true),
//           200
//         )
//       } catch {}

//       try {
//         const body: any = {
//           message: t,
//           session_id: session,
//           lang: defaultLang,
//         }
//         if (props.propertyId) body.property_id = props.propertyId
//         if (props.propertySnapshot) body.property_snapshot = props.propertySnapshot

//         const r = await fetch("/api/chat", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(body),
//         })

//         setUiSpec(null)
//         const ct = r.headers.get("Content-Type") || ""

//         // Structured UI blocks
//         if (ct.includes("application/json")) {
//           const json = await r.json()
//           setIsThinking(false)
//           if (json && json.version === "1.0" && Array.isArray(json.blocks)) {
//             setUiSpec(json as ChatUISpec)
//             setLog((l) => [
//               ...l,
//               { from: "bot", text: "Here are some options." },
//             ])
//           } else {
//             const answer: string = json.answer || ""
//             setLog((l) => [...l, { from: "bot", text: answer }])
//             if (json.result?.items) setCards(json.result.items)
//             if (speakEnabled) speak(answer)
//           }
//           return
//         }

//         // Streaming text/plain
//         if (ct.includes("text/plain") && r.body) {
//           const reader = r.body.getReader()
//           const decoder = new TextDecoder()
//           let acc = ""
//           let botIndex = -1
//           setLog((l) => {
//             const next = l.slice()
//             botIndex = next.length
//             next.push({ from: "bot", text: "" })
//             return next
//           })
//           while (true) {
//             const { done, value } = await reader.read()
//             if (done) break
//             const chunk = decoder.decode(value)
//             acc += chunk
//             const cleaned = stripBasicMarkdownArtifacts(acc)
//             setLog((l) => {
//               const next = l.slice()
//               if (botIndex >= 0 && next[botIndex])
//                 next[botIndex] = { from: "bot", text: cleaned }
//               return next
//             })
//           }
//           setIsThinking(false)
//           if (speakEnabled) speak(acc)
//           return
//         }

//         // Fallbacks
//         try {
//           const json = await r.json()
//           setIsThinking(false)
//           const answer: string = json.answer || ""
//           setLog((l) => [...l, { from: "bot", text: answer }])
//           if (json.result?.items) setCards(json.result.items)
//           if (speakEnabled) speak(answer)
//         } catch {
//           const textResp = await r.text()
//           setIsThinking(false)
//           const cleaned = stripBasicMarkdownArtifacts(textResp)
//           setLog((l) => [...l, { from: "bot", text: cleaned }])
//           if (speakEnabled) speak(cleaned)
//         }
//       } catch {
//         setLog((l) => [
//           ...l,
//           { from: "bot", text: "Sorry, something went wrong." },
//         ])
//         setIsThinking(false)
//       }
//     },
//     [defaultLang, props.propertyId, props.propertySnapshot, session, speakEnabled]
//   )

//   const send = useCallback(async () => {
//     if (!msg.trim() || isSending) return
//     setIsSending(true)
//     const text = msg
//     setMsg("")
//     try {
//       await sendToChat(text)
//     } finally {
//       setIsSending(false)
//     }
//   }, [msg, isSending, sendToChat])

//   // External programmatic send (from widget/bus)
//   useEffect(() => {
//     const onExternalSend = (e: Event) => {
//       const text = (e as CustomEvent<{ text: string }>).detail?.text ?? ""
//       const t = String(text || "").trim()
//       if (!t) return
//       ;(async () => {
//         try {
//           await sendToChat(t)
//         } catch {}
//       })()
//     }
//     const onBotGreet = (e: Event) => {
//       const detail = (e as CustomEvent<{ text: string; suggestions?: string[] }>)
//         .detail
//       if (!detail?.text) return
//       setLog((l) => [...l, { from: "bot", text: detail.text }])
//       setSuggestions(detail.suggestions || [])
//       // optional voice greeting
//       if (speakEnabled) speak(detail.text)
//     }
//     window.addEventListener("cc-chatcore-send" as any, onExternalSend as any)
//     window.addEventListener("cc-bot-greet" as any, onBotGreet as any)
//     return () => {
//       window.removeEventListener("cc-chatcore-send" as any, onExternalSend as any)
//       window.removeEventListener("cc-bot-greet" as any, onBotGreet as any)
//     }
//   }, [sendToChat, speakEnabled])

//   const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault()
//       send()
//     }
//   }

//   // manage typing indicator visibility
//   useEffect(() => {
//     if (isThinking) {
//       if (showIndicator) {
//         indicatorTimers.current.min &&
//           clearTimeout(indicatorTimers.current.min)
//         indicatorTimers.current.min = window.setTimeout(() => {}, 1000)
//       }
//     } else {
//       if (showIndicator) {
//         const hide = () => setShowIndicator(false)
//         if (indicatorTimers.current.min) {
//           const t = window.setTimeout(hide, 150)
//           indicatorTimers.current.min = undefined
//           indicatorTimers.current.delay &&
//             clearTimeout(indicatorTimers.current.delay)
//           indicatorTimers.current.delay = undefined
//           return () => clearTimeout(t)
//         } else {
//           const t = window.setTimeout(() => setShowIndicator(false), 1000)
//           return () => clearTimeout(t)
//         }
//       } else {
//         indicatorTimers.current.delay &&
//           clearTimeout(indicatorTimers.current.delay)
//         indicatorTimers.current.delay = undefined
//       }
//     }
//     return () => {}
//   }, [isThinking, showIndicator])

//   // auto-scroll
//   useEffect(() => {
//     const el = listRef.current
//     if (!el) return
//     el.scrollTop = el.scrollHeight
//   }, [log, showIndicator, uiSpec])

//   // ====== Call + STT ======
//   const [callOn, setCallOn] = useState(false)
//   const [callSeconds, setCallSeconds] = useState(0)
//   const callTimerRef = useRef<number | null>(null)
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null)
//   const mediaStreamRef = useRef<MediaStream | null>(null)
//   const sttProcessingRef = useRef(false)
//   const lastChunkRef = useRef<Blob | null>(null)
//   const headerChunkRef = useRef<Blob | null>(null)
//   const [speakingActive, setSpeakingActive] = useState(false)
//   const currentUtteranceRef = useRef<string>("")
//   const lastAppendRef = useRef<string>("")
//   const lastSttAtRef = useRef<number>(0)
//   const speakingActiveRef = useRef(false)
//   const callOnRef = useRef(false)
//   useEffect(() => {
//     speakingActiveRef.current = speakingActive
//   }, [speakingActive])
//   useEffect(() => {
//     callOnRef.current = callOn
//   }, [callOn])
//   useEffect(() => {
//     if (speakingActive) stopAudio()
//   }, [speakingActive])

//   useEffect(() => {
//     const id = setTimeout(() => {
//       props.onCallStateChange?.({ callOn, seconds: callSeconds })
//     }, 0)
//     return () => clearTimeout(id)
//   }, [callOn, callSeconds, props])

//   const getBestMime = () => {
//     const candidates = [
//       "audio/webm;codecs=opus",
//       "audio/webm",
//       "audio/ogg;codecs=opus",
//       "audio/ogg",
//       "audio/mp4",
//     ]
//     for (const c of candidates) {
//       try {
//         // @ts-ignore
//         if (
//           typeof (window as any).MediaRecorder !== "undefined" &&
//           MediaRecorder.isTypeSupported(c)
//         )
//           return c
//       } catch {}
//     }
//     return undefined
//   }

//   // Prompt + filters for STT
//   function buildSttPrompt() {
//     return [
//       "You are transcribing a real-estate buyer conversation.",
//       "Ignore TV/radio/YouTube outros like 'Thank you for watching', 'Like and subscribe', and Korean news phrases like 'MBC 뉴스'.",
//       "Prefer English unless the speaker clearly uses another language.",
//       "Focus on actionable intent like 'I need to buy properties in California'.",
//     ].join(" ")
//   }

//   function isLikelyForeignForEnglish(text: string): boolean {
//     const t = text || ""
//     const nonLatin =
//       (t.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || [])
//         .length
//     const totalLetters =
//       (t.match(/[A-Za-z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) ||
//         []).length
//     if (totalLetters === 0) return false
//     return nonLatin / totalLetters > 0.4
//   }

//   const BANNED_REGEX: RegExp[] = [
//     /thanks? for watching/gi,
//     /thank you for watching/gi,
//     /like and subscribe/gi,
//     /share this video/gi,
//     /subscribe( to| on)? (the )?channel/gi,
//     /hit the bell/gi,
//     /smash that like/gi,
//     /\bmbc\b/gi,
//     /뉴스/gi,
//   ]
//   const OFF_TOKENS = ["video", "channel", "podcast", "watching"]

//   function stripBannedPhrases(s: string) {
//     let t = s
//     for (const re of BANNED_REGEX) t = t.replace(re, " ")
//     return t.replace(/\s{2,}/g, " ").trim()
//   }

//   function isLikelyUnrelated(text: string): boolean {
//     const t = text.trim().toLowerCase()
//     if (!t) return true
//     const words = t.split(/\s+/).filter(Boolean).length
//     if (t.length < 6 || words < 2) return true
//     const offHits = OFF_TOKENS.reduce(
//       (n, w) => n + (t.includes(w) ? 1 : 0),
//       0
//     )
//     if (offHits >= 2) return true
//     return false
//   }

//   function sanitizeTranscriptForSend(raw: string) {
//     let t = stripBannedPhrases(raw)
//     if (!t) return ""
//     const sentences = t
//       .split(/(?<=[.!?])\s+|[\n\r]+/)
//       .map((s) => s.trim())
//       .filter(Boolean)
//     const kept = sentences.filter(
//       (s) => !isLikelyUnrelated(s) && !(defaultLang === "en" && isLikelyForeignForEnglish(s))
//     )
//     if (!kept.length) {
//       const frags = t
//         .split(/[.!?\n\r]+/)
//         .map((s) => s.trim())
//         .filter(Boolean)
//       return frags.sort((a, b) => b.length - a.length)[0] || ""
//     }
//     let out = kept.join(" ").replace(/\s{2,}/g, " ").trim()
//     if (defaultLang === "en" && out) {
//       out = out[0].toUpperCase() + out.slice(1)
//       if (!/[.!?]$/.test(out)) out += "."
//     }
//     return out
//   }

//   async function waitForQuiet(idleMs = 900, maxMs = 1600) {
//     try {
//       mediaRecorderRef.current?.requestData()
//     } catch {}
//     const start = Date.now()
//     let lastMark = lastSttAtRef.current
//     while (Date.now() - start < maxMs) {
//       const quietEnough =
//         Date.now() - lastSttAtRef.current >= idleMs && !sttProcessingRef.current
//       if (quietEnough) return
//       if (lastMark !== lastSttAtRef.current)
//         lastMark = lastSttAtRef.current
//       await new Promise((r) => setTimeout(r, 110))
//     }
//   }

//   const processChunk = useCallback(
//     async (blob: Blob) => {
//       if (!blob || blob.size === 0) return
//       if (ttsPlayingRef.current) return
//       if (sttProcessingRef.current) {
//         lastChunkRef.current = blob
//         return
//       }
//       sttProcessingRef.current = true
//       try {
//         const fd = new FormData()
//         const file = new File([blob], "chunk.webm", { type: "audio/webm" })
//         fd.append("audio", file)
//         fd.append("lang", defaultLang)
//         fd.append("prompt", buildSttPrompt())
//         const r = await fetch("/api/voice/stt", {
//           method: "POST",
//           body: fd,
//         }).then((r) => r.json())
//         const raw = String(r?.text || "").trim()
//         if (!callOnRef.current || !raw) {
//           // ignore
//         } else {
//           let usable = stripBannedPhrases(raw)
//           if (!usable) {
//             // nothing left
//           } else if (isLikelyUnrelated(usable)) {
//             // background
//           } else if (defaultLang === "en" && isLikelyForeignForEnglish(usable)) {
//             // ignore
//           } else if (speakingActiveRef.current) {
//             if (usable !== lastAppendRef.current) {
//               currentUtteranceRef.current = (
//                 currentUtteranceRef.current +
//                 " " +
//                 usable
//               ).trim()
//               lastAppendRef.current = usable
//               lastSttAtRef.current = Date.now()
//             }
//           }
//         }
//       } catch {
//         // swallow per-chunk errors
//       } finally {
//         sttProcessingRef.current = false
//         if (lastChunkRef.current) {
//           const next = lastChunkRef.current
//           lastChunkRef.current = null
//           processChunk(next)
//         }
//       }
//     },
//     [defaultLang]
//   )

//   const startCall = useCallback(async () => {
//     if (callOn) return
//     try {
//       if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
//         alert("Microphone not available.")
//         return
//       }
//       stopAudio()

//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           autoGainControl: true,
//           channelCount: 1,
//         } as MediaTrackConstraints,
//       })
//       mediaStreamRef.current = stream
//       const mime = getBestMime()
//       const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
//       mediaRecorderRef.current = mr
//       mr.ondataavailable = (ev: BlobEvent) => {
//         const chunk = ev.data
//         if (!chunk || chunk.size === 0) return
//         if (!headerChunkRef.current) {
//           headerChunkRef.current = chunk
//           return
//         }
//         const mimeType = mr.mimeType || "audio/webm"
//         const assembled = new Blob([headerChunkRef.current, chunk], {
//           type: mimeType,
//         })
//         processChunk(assembled)
//       }
//       mr.start(850)

//       setCallOn(true)
//       setSpeakingActive(true)
//       setTimeout(() => setSpeakEnabled(true), 0)

//       setCallSeconds(0)
//       if (callTimerRef.current) window.clearInterval(callTimerRef.current)
//       callTimerRef.current = window.setInterval(
//         () => setCallSeconds((s) => s + 1),
//         1000
//       )
//     } catch {
//       alert("Microphone not available.")
//     }
//   }, [callOn, setSpeakEnabled, processChunk])

//   const endCall = useCallback(() => {
//     if (!callOn) return
//     try {
//       mediaRecorderRef.current?.stop()
//     } catch {}
//     try {
//       mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
//     } catch {}
//     mediaRecorderRef.current = null
//     mediaStreamRef.current = null
//     sttProcessingRef.current = false
//     lastChunkRef.current = null
//     headerChunkRef.current = null
//     setSpeakingActive(false)
//     currentUtteranceRef.current = ""
//     lastAppendRef.current = ""
//     if (callTimerRef.current) {
//       window.clearInterval(callTimerRef.current)
//       callTimerRef.current = null
//     }
//     setCallOn(false)
//     stopAudio()
//   }, [callOn])

//   const toggleCall = useCallback(async () => {
//     if (callOn) endCall()
//     else await startCall()
//   }, [callOn, startCall, endCall])

//   useImperativeHandle(
//     ref,
//     () => ({
//       startCall,
//       endCall,
//       toggleCall,
//       getState: () => ({ callOn, seconds: callSeconds }),
//     }),
//     [startCall, endCall, toggleCall, callOn, callSeconds]
//   )

//   useEffect(
//     () => () => {
//       stopAudio()
//       try {
//         mediaRecorderRef.current?.stop()
//       } catch {}
//       try {
//         mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
//       } catch {}
//       if (callTimerRef.current) window.clearInterval(callTimerRef.current)
//     },
//     []
//   )

//   // Restore recent text turns + last UI spec
//   useEffect(() => {
//     let cancelled = false
//     ;(async () => {
//       try {
//         const r = await fetch("/api/chat/session", { method: "GET" })
//         if (!r.ok) return
//         const { messages } = await r.json()
//         if (cancelled || !Array.isArray(messages) || !messages.length) return
//         const textTurns: ChatMsg[] = []
//         let lastSpec: any = null
//         for (const m of messages) {
//           const role = m.role
//           const content = m.content
//           if (content && typeof content === "object" && content.version === "1.0") {
//             lastSpec = content
//           } else if (
//             content &&
//             typeof content === "object" &&
//             typeof content.text === "string"
//           ) {
//             if (role === "user" || role === "assistant")
//               textTurns.push({
//                 from: role === "user" ? "user" : "bot",
//                 text: content.text,
//               })
//           } else if (typeof content === "string") {
//             if (role === "user" || role === "assistant")
//               textTurns.push({
//                 from: role === "user" ? "user" : "bot",
//                 text: content,
//               })
//           }
//         }
//         if (textTurns.length) setLog(textTurns)
//         if (lastSpec) setUiSpec(lastSpec)
//       } catch {}
//     })()
//     return () => {
//       cancelled = true
//     }
//   }, [])

//   // ====== UI ======
//   return (
//     <div className="flex flex-col h-full min-h-0">
//       {/* Messages */}
//       <div
//         ref={listRef}
//         className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3"
//         aria-live="polite"
//       >
//         {log.map((m, i) => (
//           <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
//             <div
//               className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
//                 m.from === "user"
//                   ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
//                   : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
//               }`}
//             >
//               {m.text}
//             </div>
//           </div>
//         ))}

//         {/* Typing dots */}
//         {showIndicator && (
//           <div className="flex items-start">
//             <div className="inline-flex items-center space-x-1 px-3 py-2 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800/80 dark:text-gray-100 transition-opacity duration-200">
//               <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
//               <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
//               <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce" />
//             </div>
//           </div>
//         )}

//         {/* Structured UI from the assistant */}
//         {uiSpec && (
//           <div className="pt-1">
//             <ChatMessageRenderer spec={uiSpec} />
//           </div>
//         )}

//         {/* Property cards (legacy) */}
//         {cards.length > 0 && (
//           <div className="pt-2">
//             <PropertyCards items={cards} />
//           </div>
//         )}

//         {/* Quick replies */}
//         {suggestions.length > 0 && (
//           <div className="flex flex-wrap gap-2 pt-1">
//             {suggestions.map((s, idx) => (
//               <button
//                 key={idx}
//                 onClick={() => sendToChat(s)}
//                 className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
//               >
//                 {s}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Voice mini-player (for TTS replies) */}
//       {ttsState !== "idle" && (
//         <div className="px-3 pb-1">
//           <div className="flex items-center gap-2 text-sm rounded-xl border bg-white px-3 py-2">
//             <span>Assistant voice reply</span>
//             <button onClick={toggleAudio} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
//               {ttsState === "playing" ? "Pause" : "Play"}
//             </button>
//             <button onClick={stopAudio} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
//               Stop
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Input / Call controls */}
//       <div className="sticky bottom-0 z-10 p-3 border-t bg-white text-gray-900">
//         {/* Press-and-hold talk (only when call mode is on) */}
//         {callOn && (
//           <div className="mb-2 flex items-center justify-between">
//             <span className="text-xs text-gray-600">Voice mode active — hold to talk or use the button below.</span>
//             <button
//               onMouseDown={() => {
//                 stopAudio()
//                 currentUtteranceRef.current = ""
//                 lastAppendRef.current = ""
//                 setSpeakingActive(true)
//               }}
//               onMouseUp={async () => {
//                 setSpeakingActive(false)
//                 await waitForQuiet(900, 1600)
//                 const finalRaw = currentUtteranceRef.current.trim()
//                 currentUtteranceRef.current = ""
//                 lastAppendRef.current = ""
//                 const cleaned = sanitizeTranscriptForSend(finalRaw)
//                 if (cleaned) await sendToChat(cleaned)
//               }}
//               onTouchStart={(e) => {
//                 e.preventDefault()
//                 stopAudio()
//                 currentUtteranceRef.current = ""
//                 lastAppendRef.current = ""
//                 setSpeakingActive(true)
//               }}
//               onTouchEnd={async (e) => {
//                 e.preventDefault()
//                 setSpeakingActive(false)
//                 await waitForQuiet(900, 1600)
//                 const finalRaw = currentUtteranceRef.current.trim()
//                 currentUtteranceRef.current = ""
//                 lastAppendRef.current = ""
//                 const cleaned = sanitizeTranscriptForSend(finalRaw)
//                 if (cleaned) await sendToChat(cleaned)
//               }}
//               className={`text-xs px-3 py-1 rounded-full border ${
//                 speakingActive
//                   ? "bg-amber-100 text-amber-800 border-amber-200"
//                   : "bg-emerald-50 text-emerald-800 border-emerald-200"
//               }`}
//               aria-label="Hold to talk"
//             >
//               {speakingActive ? "Listening…" : "Hold to Talk"}
//             </button>
//           </div>
//         )}

//         <div className="flex gap-2">
//           <input
//             className="flex-1 border rounded-xl px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500"
//             value={msg}
//             onChange={(e) => setMsg(e.target.value)}
//             onKeyDown={onKeyDown}
//             placeholder="Ask about homes, listings, tours…"
//             aria-label="Chat input"
//           />
//           <button
//             onClick={send}
//             disabled={isSending}
//             className="px-3 py-2 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
//             aria-label="Send"
//           >
//             Send
//           </button>
//           <button
//             onClick={() => toggleCall()}
//             className={`px-3 py-2 rounded-xl border shadow-sm ${
//               callOn
//                 ? "bg-red-50 border-red-300 text-red-700"
//                 : "bg-gray-50 border-gray-200 text-gray-700"
//             }`}
//             aria-label={callOn ? "End call" : "Start call"}
//             title={callOn ? "End call" : "Start call"}
//           >
//             {callOn ? "End" : "🎤"}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// })








































"use client"
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react"
import { PropertyCards } from "../PropertyCards"
import { ChatMessageRenderer } from "../chat/ChatMessageRenderer"
import type { ChatUISpec } from "../../lib/ui-spec"
import { stripBasicMarkdownArtifacts } from "../../lib/sanitize"
import { IconSend, IconMic, IconMicOff } from "../icons/CcIcons"

type ChatCoreProps = {
  defaultLang?: string
  propertyId?: string
  propertySnapshot?: any
  autoplayVoice?: boolean
  hideHeader?: boolean
  speakEnabled?: boolean
  onSpeakEnabledChange?: (v: boolean) => void
  onCallStateChange?: (s: { callOn: boolean; seconds: number }) => void
}

type ChatMsg = { from: "user" | "bot"; text: string }

export type ChatCoreHandle = {
  startCall: () => Promise<void>
  endCall: () => void
  toggleCall: () => Promise<void>
  getState: () => { callOn: boolean; seconds: number }
}

export const ChatCore = forwardRef<ChatCoreHandle, ChatCoreProps>(function ChatCore(
  props,
  ref
) {
  const defaultLang = props.defaultLang || "en"

  // ---------- readiness ping so the widget can safely greet ----------
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("cc-chatcore-ready"))
    } catch {}
  }, [])

  // ---------- chat state ----------
  const [msg, setMsg] = useState("")
  const [log, setLog] = useState<ChatMsg[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [uiSpec, setUiSpec] = useState<ChatUISpec | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const indicatorTimers = useRef<{ delay?: number; min?: number }>({})
  const [suggestions, setSuggestions] = useState<string[]>([])

  // voice replies toggle (controlled or uncontrolled)
  const [speakEnabledUncontrolled, setSpeakEnabledUncontrolled] = useState(
    !!props.autoplayVoice
  )
  const speakEnabled = props.speakEnabled ?? speakEnabledUncontrolled
  const setSpeakEnabled =
    props.onSpeakEnabledChange ?? setSpeakEnabledUncontrolled

  // sticky session id
  const session = useMemo(() => {
    if (typeof window === "undefined") return crypto.randomUUID()
    const key = "cc_session"
    const existing = window.localStorage.getItem(key)
    if (existing) return existing
    const id = crypto.randomUUID()
    window.localStorage.setItem(key, id)
    return id
  }, [])

  const [isSending, setIsSending] = useState(false)

  // ---------- TTS mini-player ----------
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  const ttsPlayingRef = useRef(false)
  const [ttsState, setTtsState] = useState<"idle" | "playing" | "paused">("idle")

  const stopAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
        currentAudioUrlRef.current = null
      }
      ttsPlayingRef.current = false
      setTtsState("idle")
      // resume mic if it was paused by TTS during a call
      try {
        const mr = mediaRecorderRef.current
        if (mr && callOnRef.current && mr.state === "paused") mr.resume()
      } catch {}
    } catch {}
  }

  const toggleAudio = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }

  const speak = async (text: string) => {
    if (!speakEnabled || !text) return
    stopAudio()
    try {
      const r = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy" }),
      })
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      currentAudioUrlRef.current = url
      const a = new Audio(url)
      audioRef.current = a
      a.onplay = () => {
        ttsPlayingRef.current = true
        setTtsState("playing")
        try {
          const mr = mediaRecorderRef.current
          if (mr && mr.state === "recording") mr.pause()
        } catch {}
      }
      const clearTts = () => {
        ttsPlayingRef.current = false
        setTtsState("idle")
        try {
          const mr = mediaRecorderRef.current
          if (mr && callOnRef.current && mr.state === "paused") mr.resume()
        } catch {}
      }
      a.onpause = () => setTtsState("paused")
      a.onended = clearTts
      a.play().catch(() => {})
    } catch {}
  }

  useEffect(() => {
    if (!speakEnabled) stopAudio()
  }, [speakEnabled])

  // ---------- send to chat (text/voice) ----------
  const sendToChat = useCallback(
    async (text: string) => {
      const t = (text || "").trim()
      if (!t) return
      setSuggestions([])
      setLog((l) => [...l, { from: "user", text: t }])

      // typing indicator timing
      setIsThinking(true)
      try {
        indicatorTimers.current.delay &&
          clearTimeout(indicatorTimers.current.delay)
        indicatorTimers.current.delay = window.setTimeout(
          () => setShowIndicator(true),
          200
        )
      } catch {}

      try {
        const body: any = {
          message: t,
          session_id: session,
          lang: defaultLang,
        }
        if (props.propertyId) body.property_id = props.propertyId
        if (props.propertySnapshot) body.property_snapshot = props.propertySnapshot

        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        setUiSpec(null)
        const ct = r.headers.get("Content-Type") || ""

        // Structured UI blocks
        if (ct.includes("application/json")) {
          const json = await r.json()
          setIsThinking(false)
          if (json && json.version === "1.0" && Array.isArray(json.blocks)) {
            setUiSpec(json as ChatUISpec)
            setLog((l) => [
              ...l,
              { from: "bot", text: "Here are some options." },
            ])
          } else {
            const answer: string = json.answer || ""
            setLog((l) => [...l, { from: "bot", text: answer }])
            if (json.result?.items) setCards(json.result.items)
            if (speakEnabled) speak(answer)
          }
          return
        }

        // Streaming text/plain
        if (ct.includes("text/plain") && r.body) {
          const reader = r.body.getReader()
          const decoder = new TextDecoder()
          let acc = ""
          let botIndex = -1
          setLog((l) => {
            const next = l.slice()
            botIndex = next.length
            next.push({ from: "bot", text: "" })
            return next
          })
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            acc += chunk
            const cleaned = stripBasicMarkdownArtifacts(acc)
            setLog((l) => {
              const next = l.slice()
              if (botIndex >= 0 && next[botIndex])
                next[botIndex] = { from: "bot", text: cleaned }
              return next
            })
          }
          setIsThinking(false)
          if (speakEnabled) speak(acc)
          return
        }

        // Fallbacks
        try {
          const json = await r.json()
          setIsThinking(false)
          const answer: string = json.answer || ""
          setLog((l) => [...l, { from: "bot", text: answer }])
          if (json.result?.items) setCards(json.result.items)
          if (speakEnabled) speak(answer)
        } catch {
          const textResp = await r.text()
          setIsThinking(false)
          const cleaned = stripBasicMarkdownArtifacts(textResp)
          setLog((l) => [...l, { from: "bot", text: cleaned }])
          if (speakEnabled) speak(cleaned)
        }
      } catch {
        setLog((l) => [
          ...l,
          { from: "bot", text: "Sorry, something went wrong." },
        ])
        setIsThinking(false)
      }
    },
    [defaultLang, props.propertyId, props.propertySnapshot, session, speakEnabled]
  )

  const send = useCallback(async () => {
    if (!msg.trim() || isSending) return
    setIsSending(true)
    const text = msg
    setMsg("")
    try {
      await sendToChat(text)
    } finally {
      setIsSending(false)
    }
  }, [msg, isSending, sendToChat])

  // programmatic send + greeting from widget
  useEffect(() => {
    const onExternalSend = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text ?? ""
      const t = String(text || "").trim()
      if (!t) return
      ;(async () => {
        try {
          await sendToChat(t)
        } catch {}
      })()
    }
    const onBotGreet = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string; suggestions?: string[] }>)
        .detail
      if (!detail?.text) return
      setLog((l) => [...l, { from: "bot", text: detail.text }])
      setSuggestions(detail.suggestions || [])
      if (speakEnabled) speak(detail.text)
    }
    window.addEventListener("cc-chatcore-send" as any, onExternalSend as any)
    window.addEventListener("cc-bot-greet" as any, onBotGreet as any)
    return () => {
      window.removeEventListener("cc-chatcore-send" as any, onExternalSend as any)
      window.removeEventListener("cc-bot-greet" as any, onBotGreet as any)
    }
  }, [sendToChat, speakEnabled])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      send()
    }
  }

  // typing indicator visibility
  useEffect(() => {
    if (isThinking) {
      if (showIndicator) {
        indicatorTimers.current.min &&
          clearTimeout(indicatorTimers.current.min)
        indicatorTimers.current.min = window.setTimeout(() => {}, 1000)
      }
    } else {
      if (showIndicator) {
        const hide = () => setShowIndicator(false)
        if (indicatorTimers.current.min) {
          const t = window.setTimeout(hide, 150)
          indicatorTimers.current.min = undefined
          indicatorTimers.current.delay &&
            clearTimeout(indicatorTimers.current.delay)
          indicatorTimers.current.delay = undefined
          return () => clearTimeout(t)
        } else {
          const t = window.setTimeout(() => setShowIndicator(false), 1000)
          return () => clearTimeout(t)
        }
      } else {
        indicatorTimers.current.delay &&
          clearTimeout(indicatorTimers.current.delay)
        indicatorTimers.current.delay = undefined
      }
    }
    return () => {}
  }, [isThinking, showIndicator])

  // auto-scroll
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [log, showIndicator, uiSpec])

  // ---------- Call + STT (single, deduped block) ----------
  const [callOn, setCallOn] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const callTimerRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sttProcessingRef = useRef(false)
  const lastChunkRef = useRef<Blob | null>(null)
  const headerChunkRef = useRef<Blob | null>(null)
  const [speakingActive, setSpeakingActive] = useState(false)
  const currentUtteranceRef = useRef<string>("")
  const lastAppendRef = useRef<string>("")
  const lastSttAtRef = useRef<number>(0)
  const speakingActiveRef = useRef(false)
  const callOnRef = useRef(false)

  useEffect(() => {
    speakingActiveRef.current = speakingActive
  }, [speakingActive])
  useEffect(() => {
    callOnRef.current = callOn
  }, [callOn])
  useEffect(() => {
    if (speakingActive) stopAudio()
  }, [speakingActive])

  useEffect(() => {
    const id = setTimeout(() => {
      props.onCallStateChange?.({ callOn, seconds: callSeconds })
    }, 0)
    return () => clearTimeout(id)
  }, [callOn, callSeconds, props])

  const getBestMime = () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ]
    for (const c of candidates) {
      try {
        if (
          typeof (window as any).MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported(c)
        ) {
          return c
        }
      } catch {}
    }
    return undefined
  }

  function buildSttPrompt() {
    return [
      "You are transcribing a real-estate buyer conversation.",
      "Ignore TV/radio/YouTube outros like 'Thank you for watching', 'Like and subscribe', and Korean news phrases like 'MBC 뉴스'.",
      "Prefer English unless the speaker clearly uses another language.",
      "Focus on actionable intent like 'I need to buy properties in California'.",
    ].join(" ")
  }

  function isLikelyForeignForEnglish(text: string): boolean {
    const t = text || ""
    const nonLatin =
      (t.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || [])
        .length
    const totalLetters =
      (t.match(/[A-Za-z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) ||
        []).length
    if (totalLetters === 0) return false
    return nonLatin / totalLetters > 0.4
  }

  const BANNED_REGEX: RegExp[] = [
    /thanks? for watching/gi,
    /thank you for watching/gi,
    /like and subscribe/gi,
    /share this video/gi,
    /subscribe( to| on)? (the )?channel/gi,
    /hit the bell/gi,
    /smash that like/gi,
    /\bmbc\b/gi,
    /뉴스/gi,
  ]
  const OFF_TOKENS = ["video", "channel", "podcast", "watching"]

  function stripBannedPhrases(s: string) {
    let t = s
    for (const re of BANNED_REGEX) t = t.replace(re, " ")
    return t.replace(/\s{2,}/g, " ").trim()
  }

  function isLikelyUnrelated(text: string): boolean {
    const t = text.trim().toLowerCase()
    if (!t) return true
    const words = t.split(/\s+/).filter(Boolean).length
    if (t.length < 6 || words < 2) return true
    const offHits = OFF_TOKENS.reduce(
      (n, w) => n + (t.includes(w) ? 1 : 0),
      0
    )
    if (offHits >= 2) return true
    return false
  }

  function sanitizeTranscriptForSend(raw: string) {
    let t = stripBannedPhrases(raw)
    if (!t) return ""
    const sentences = t
      .split(/(?<=[.!?])\s+|[\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const kept = sentences.filter(
      (s) => !isLikelyUnrelated(s) && !(defaultLang === "en" && isLikelyForeignForEnglish(s))
    )
    if (!kept.length) {
      const frags = t
        .split(/[.!?\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      return frags.sort((a, b) => b.length - a.length)[0] || ""
    }
    let out = kept.join(" ").replace(/\s{2,}/g, " ").trim()
    if (defaultLang === "en" && out) {
      out = out[0].toUpperCase() + out.slice(1)
      if (!/[.!?]$/.test(out)) out += "."
    }
    return out
  }

  async function waitForQuiet(idleMs = 900, maxMs = 1600) {
    try {
      mediaRecorderRef.current?.requestData()
    } catch {}
    const start = Date.now()
    let lastMark = lastSttAtRef.current
    while (Date.now() - start < maxMs) {
      const quietEnough =
        Date.now() - lastSttAtRef.current >= idleMs && !sttProcessingRef.current
      if (quietEnough) return
      if (lastMark !== lastSttAtRef.current)
        lastMark = lastSttAtRef.current
      await new Promise((r) => setTimeout(r, 110))
    }
  }

  const processChunk = useCallback(
    async (blob: Blob) => {
      if (!blob || blob.size === 0) return
      if (ttsPlayingRef.current) return
      if (sttProcessingRef.current) {
        lastChunkRef.current = blob
        return
      }
      sttProcessingRef.current = true
      try {
        const fd = new FormData()
        const file = new File([blob], "chunk.webm", { type: "audio/webm" })
        fd.append("audio", file)
        fd.append("lang", defaultLang)
        fd.append("prompt", buildSttPrompt())
        const r = await fetch("/api/voice/stt", {
          method: "POST",
          body: fd,
        }).then((r) => r.json())
        const raw = String(r?.text || "").trim()
        if (!callOnRef.current || !raw) {
          // ignore
        } else {
          let usable = stripBannedPhrases(raw)
          if (!usable) {
            // nothing left
          } else if (isLikelyUnrelated(usable)) {
            // background
          } else if (defaultLang === "en" && isLikelyForeignForEnglish(usable)) {
            // ignore
          } else if (speakingActiveRef.current) {
            if (usable !== lastAppendRef.current) {
              currentUtteranceRef.current = (
                currentUtteranceRef.current +
                " " +
                usable
              ).trim()
              lastAppendRef.current = usable
              lastSttAtRef.current = Date.now()
            }
          }
        }
      } catch {
        // swallow per-chunk errors
      } finally {
        sttProcessingRef.current = false
        if (lastChunkRef.current) {
          const next = lastChunkRef.current
          lastChunkRef.current = null
          processChunk(next)
        }
      }
    },
    [defaultLang]
  )

  const startCall = useCallback(async () => {
    if (callOn) return
    try {
      if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
        alert("Microphone not available.")
        return
      }
      stopAudio()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        } as MediaTrackConstraints,
      })
      mediaStreamRef.current = stream
      const mime = getBestMime()
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (ev: BlobEvent) => {
        const chunk = ev.data
        if (!chunk || chunk.size === 0) return
        if (!headerChunkRef.current) {
          headerChunkRef.current = chunk
          return
        }
        const mimeType = mr.mimeType || "audio/webm"
        const assembled = new Blob([headerChunkRef.current, chunk], {
          type: mimeType,
        })
        processChunk(assembled)
      }
      mr.start(850)

      setCallOn(true)
      setSpeakingActive(true)
      setTimeout(() => setSpeakEnabled(true), 0)

      setCallSeconds(0)
      if (callTimerRef.current) window.clearInterval(callTimerRef.current)
      callTimerRef.current = window.setInterval(
        () => setCallSeconds((s) => s + 1),
        1000
      )
    } catch {
      alert("Microphone not available.")
    }
  }, [callOn, setSpeakEnabled, processChunk])

  const endCall = useCallback(() => {
    if (!callOn) return
    try {
      mediaRecorderRef.current?.stop()
    } catch {}
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    mediaRecorderRef.current = null
    mediaStreamRef.current = null
    sttProcessingRef.current = false
    lastChunkRef.current = null
    headerChunkRef.current = null
    setSpeakingActive(false)
    currentUtteranceRef.current = ""
    lastAppendRef.current = ""
    if (callTimerRef.current) {
      window.clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
    setCallOn(false)
    stopAudio()
  }, [callOn])

  const toggleCall = useCallback(async () => {
    if (callOn) endCall()
    else await startCall()
  }, [callOn, startCall, endCall])

  useImperativeHandle(
    ref,
    () => ({
      startCall,
      endCall,
      toggleCall,
      getState: () => ({ callOn, seconds: callSeconds }),
    }),
    [startCall, endCall, toggleCall, callOn, callSeconds]
  )

  useEffect(
    () => () => {
      stopAudio()
      try {
        mediaRecorderRef.current?.stop()
      } catch {}
      try {
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch {}
      if (callTimerRef.current) window.clearInterval(callTimerRef.current)
    },
    []
  )

  // restore recent text turns + last UI spec
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch("/api/chat/session", { method: "GET" })
        if (!r.ok) return
        const { messages } = await r.json()
        if (cancelled || !Array.isArray(messages) || !messages.length) return
        const textTurns: ChatMsg[] = []
        let lastSpec: any = null
        for (const m of messages) {
          const role = m.role
          const content = m.content
          if (content && typeof content === "object" && content.version === "1.0") {
            lastSpec = content
          } else if (
            content &&
            typeof content === "object" &&
            typeof content.text === "string"
          ) {
            if (role === "user" || role === "assistant")
              textTurns.push({
                from: role === "user" ? "user" : "bot",
                text: content.text,
              })
          } else if (typeof content === "string") {
            if (role === "user" || role === "assistant")
              textTurns.push({
                from: role === "user" ? "user" : "bot",
                text: content,
              })
          }
        }
        if (textTurns.length) setLog(textTurns)
        if (lastSpec) setUiSpec(lastSpec)
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ---------- UI ----------
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3"
        aria-live="polite"
      >
        {log.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                m.from === "user"
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                  : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {showIndicator && (
          <div className="flex items-start">
            <div className="inline-flex items-center space-x-1 px-3 py-2 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800/80 dark:text-gray-100 transition-opacity duration-200">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce" />
            </div>
          </div>
        )}

        {/* Structured UI from the assistant */}
        {uiSpec && (
          <div className="pt-1">
            <ChatMessageRenderer spec={uiSpec} />
          </div>
        )}

        {/* Property cards (legacy) */}
        {cards.length > 0 && (
          <div className="pt-2">
            <PropertyCards items={cards} />
          </div>
        )}

        {/* Quick replies */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendToChat(s)}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voice mini-player (for TTS replies) */}
      {ttsState !== "idle" && (
        <div className="px-3 pb-1">
          <div className="flex items-center gap-2 text-sm rounded-xl border bg-white px-3 py-2">
            <span>Assistant voice reply</span>
            <button onClick={toggleAudio} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
              {ttsState === "playing" ? "Pause" : "Play"}
            </button>
            <button onClick={stopAudio} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Input / Voice controls */}
      <div className="sticky bottom-0 z-10 p-3 border-t bg-white text-gray-900">
        {callOn && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-600">Voice mode active — hold to talk or use the button below.</span>
            <button
              onMouseDown={() => {
                stopAudio()
                currentUtteranceRef.current = ""
                lastAppendRef.current = ""
                setSpeakingActive(true)
              }}
              onMouseUp={async () => {
                setSpeakingActive(false)
                await waitForQuiet(900, 1600)
                const finalRaw = currentUtteranceRef.current.trim()
                currentUtteranceRef.current = ""
                lastAppendRef.current = ""
                const cleaned = sanitizeTranscriptForSend(finalRaw)
                if (cleaned) await sendToChat(cleaned)
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                stopAudio()
                currentUtteranceRef.current = ""
                lastAppendRef.current = ""
                setSpeakingActive(true)
              }}
              onTouchEnd={async (e) => {
                e.preventDefault()
                setSpeakingActive(false)
                await waitForQuiet(900, 1600)
                const finalRaw = currentUtteranceRef.current.trim()
                currentUtteranceRef.current = ""
                lastAppendRef.current = ""
                const cleaned = sanitizeTranscriptForSend(finalRaw)
                if (cleaned) await sendToChat(cleaned)
              }}
              className={`text-xs px-3 py-1 rounded-full border ${
                speakingActive
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
              aria-label="Hold to talk"
            >
              {speakingActive ? "Listening…" : "Hold to Talk"}
            </button>
          </div>
        )}

        <div className="flex items-stretch gap-2">
          <input
            className="flex-1 border rounded-xl px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about homes, listings, tours…"
            aria-label="Chat input"
          />
          {/* Arrow send icon */}
          <button
            onClick={send}
            disabled={isSending}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center"
            aria-label="Send message"
            title="Send"
          >
            <IconSend size={18} />
          </button>
          {/* Voice input toggle (mic / mic-off) */}
          <button
            onClick={() => toggleCall()}
            className={`px-3 py-2 rounded-xl border shadow-sm inline-flex items-center justify-center ${
              callOn
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
            aria-label={callOn ? "Stop voice input" : "Start voice input"}
            title={callOn ? "Stop voice input" : "Start voice input"}
          >
            {callOn ? <IconMicOff size={18} /> : <IconMic size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
})
