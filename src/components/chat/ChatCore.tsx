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
// import { PropertyCards } from "@/components/PropertyCards"

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

//   // Audio refs for TTS playback
//   const audioRef = useRef<HTMLAudioElement | null>(null)
//   const currentAudioUrlRef = useRef<string | null>(null)
//   // When TTS is playing, we pause the recorder and ignore STT to avoid feedback
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
//       // Clear TTS flag and resume recorder if it was paused
//       ttsPlayingRef.current = false
//       try {
//         const mr = mediaRecorderRef.current
//         if (mr && callOnRef.current && mr.state === "paused") mr.resume()
//       } catch {}
//     } catch {}
//   }

//   const speak = async (text: string) => {
//     if (!speakEnabled || !text) return
//     // stop any previous speech before starting a new one
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
//       // Pause recorder while TTS is playing to avoid transcribing the bot
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
//     } catch {
//       // ignore tts failures
//     }
//   }

//   // If speak is disabled while audio is playing, stop playback immediately
//   useEffect(() => {
//     if (!speakEnabled) stopAudio()
//   }, [speakEnabled])

//   // Unified send-to-chat for both text and voice pathways (does not toggle isSending/UI state)
//   const sendToChat = useCallback(
//     async (text: string) => {
//       const t = (text || "").trim()
//       if (!t) return
//       setLog((l) => [...l, { from: "user", text: t }])
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
//         }).then((r) => r.json())
//         const answer: string = r.answer || ""
//         setLog((l) => [...l, { from: "bot", text: answer }])
//         if (r.result?.items) setCards(r.result.items)
//         if (speakEnabled) speak(answer) // reply in voice too
//       } catch {
//         setLog((l) => [...l, { from: "bot", text: "Sorry, something went wrong." }])
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

//   // Enter key to send
//   const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault()
//       send()
//     }
//   }

//   // Call Mode: continuous MediaRecorder + STT queue
//   const [callOn, setCallOn] = useState(false)
//   const [callSeconds, setCallSeconds] = useState(0)
//   const callTimerRef = useRef<number | null>(null)
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null)
//   const mediaStreamRef = useRef<MediaStream | null>(null)
//   const sttProcessingRef = useRef(false)
//   const lastChunkRef = useRef<Blob | null>(null)
//   // Keep the first chunk, which generally contains the WebM/Opus container header
//   const headerChunkRef = useRef<Blob | null>(null)
//   // Speaking session buffer: accumulate transcripts until user stops speaking
//   const [speakingActive, setSpeakingActive] = useState(false)
//   const currentUtteranceRef = useRef<string>("")
//   const lastAppendRef = useRef<string>("")
//   // Track the last time we accepted/added STT text to the utterance buffer
//   const lastSttAtRef = useRef<number>(0)
//   // Refs to avoid stale closures inside MediaRecorder callbacks
//   const speakingActiveRef = useRef(false)
//   const callOnRef = useRef(false)
//   useEffect(() => { speakingActiveRef.current = speakingActive }, [speakingActive])
//   useEffect(() => { callOnRef.current = callOn }, [callOn])
//   // If user begins speaking, immediately cut off any bot speech
//   useEffect(() => { if (speakingActive) stopAudio() }, [speakingActive])

//   // Inform parent (widget shell) about call state
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

//   // Domain prompt to bias Whisper toward real-estate queries and ignore background media
//   function buildSttPrompt() {
//     return [
//       "You are transcribing a real estate buyer conversation.",
//       "Ignore background media, ads, podcasts, YouTube endings like 'thanks for watching', 'share this video', or other unrelated chatter.",
//       "Prefer English unless the user clearly speaks another language.",
//       "Transcribe concise buyer intent like 'I want to buy properties in California'.",
//     ].join(" ")
//   }

//   // Gating by character script (when default language is English)
//   function isLikelyForeignForEnglish(text: string): boolean {
//     const t = text || ""
//     // Count non-Latin scripts (CJK + Hangul + Kana)
//     const nonLatin = (t.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
//     const totalLetters = (t.match(/[A-Za-z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
//     if (totalLetters === 0) return false
//     const ratio = nonLatin / totalLetters
//     // If majority is non-Latin and our default language is English, treat as foreign/background
//     return ratio > 0.4
//   }

//   // Heuristic filter to drop unrelated/noisy transcripts (e.g., background videos)
//   function isLikelyUnrelated(text: string): boolean {
//     const t = text.trim().toLowerCase()
//     if (!t) return true
//     // Very short blips are likely noise
//     const wordCount = t.split(/\s+/).filter(Boolean).length
//     if (t.length < 6 || wordCount < 2) return true
//     // Common background phrases from videos/podcasts/YouTube
//     const banned = [
//       /thanks? for watching/,
//       /thank you for watching/,
//       /like and subscribe/,
//       /share this video/,
//       /share this video with your friends/,
//       /subscribe( to| on)? (the )?channel/,
//       /hit the bell/,
//       /smash that like/,
//       /bye( guys| everyone| sam)?/,
//       /bruh/,
//       /today we'?re going to/,
//       /mbc/,
//       /뉴스/, // Korean "news"
//     ]
//     if (banned.some((re) => re.test(t))) return true
//     const offTokens = ["video", "channel", "podcast"]
//     const hits = offTokens.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
//     if (hits >= 2) return true
//     return false
//   }

//   // Helper: wait for STT pipeline to drain briefly (so last chunk is included)
//   async function waitForDrain(timeoutMs = 900) {
//     const start = Date.now()
//     // Wait while a chunk is being processed
//     while (sttProcessingRef.current && Date.now() - start < timeoutMs) {
//       await new Promise((r) => setTimeout(r, 80))
//     }
//     // Small grace to allow the tail chunk to enqueue and process
//     await new Promise((r) => setTimeout(r, 140))
//   }

//   // Wait until the STT stream is quiet for idleMs (default 1000ms) or maxMs timeout.
//   // Also force-flush MediaRecorder buffer once at the start so we don't miss the tail.
//   async function waitForQuiet(idleMs = 1000, maxMs = 1800) {
//     try {
//       // Flush any buffered audio chunk immediately
//       mediaRecorderRef.current?.requestData()
//     } catch {}
//     const start = Date.now()
//     let lastMark = lastSttAtRef.current
//     while (Date.now() - start < maxMs) {
//       // If nothing appended for idleMs and no processing going on, we're quiet
//       const quietEnough = Date.now() - lastSttAtRef.current >= idleMs && !sttProcessingRef.current
//       if (quietEnough) return
//       // If new text appended since last loop, reset lastMark
//       if (lastMark !== lastSttAtRef.current) {
//         lastMark = lastSttAtRef.current
//       }
//       await new Promise((r) => setTimeout(r, 120))
//     }
//   }

//   const processChunk = useCallback(
//     async (blob: Blob) => {
//       if (!blob || blob.size === 0) return
//       // Ignore chunks while TTS is playing to prevent self-hearing
//       if (ttsPlayingRef.current) return
//       if (sttProcessingRef.current) {
//         lastChunkRef.current = blob
//         return
//       }
//       sttProcessingRef.current = true
//       try {
//         const fd = new FormData()
//         // Force stable webm container for Whisper
//         const file = new File([blob], "chunk.webm", { type: "audio/webm" })
//         fd.append("audio", file)
//         fd.append("lang", defaultLang)
//         fd.append("prompt", buildSttPrompt())
//         const r = await fetch("/api/voice/stt", { method: "POST", body: fd }).then((r) => r.json())
//         const text: string = r?.text || ""
//         const cleaned = text.trim()
//         if (!callOnRef.current || !cleaned) {
//           // ignore empty or if call already ended
//         } else {
//           // Drop unrelated/noisy transcripts
//           if (isLikelyUnrelated(cleaned)) {
//             // ignore background media
//           } else
//           if (defaultLang === "en" && isLikelyForeignForEnglish(cleaned)) {
//             // ignore mostly non-Latin chunks when expecting English
//           } else
//           // We accumulate only when 'speaking' is active to mirror push-to-talk UX.
//           // (If you want continuous dictation, remove the speakingActive check.)
//           if (speakingActiveRef.current) {
//             if (cleaned !== lastAppendRef.current) {
//               currentUtteranceRef.current = (currentUtteranceRef.current + " " + cleaned).trim()
//               lastAppendRef.current = cleaned
//               lastSttAtRef.current = Date.now()
//             }
//           }
//         }
//       } catch {
//         // ignore STT errors per-chunk
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
//       // If bot is speaking, cut it off when we begin to speak
//       stopAudio()

//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           autoGainControl: true,
//         } as MediaTrackConstraints,
//       })
//       mediaStreamRef.current = stream
//       const mime = getBestMime()
//       const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
//       mediaRecorderRef.current = mr
//       mr.ondataavailable = (ev: BlobEvent) => {
//         const chunk = ev.data
//         if (!chunk || chunk.size === 0) return
//         // Cache header chunk once; we'll prepend it to each subsequent chunk
//         if (!headerChunkRef.current) {
//           headerChunkRef.current = chunk
//           return
//         }
//         const mimeType = mr.mimeType || "audio/webm"
//         const assembled = new Blob([headerChunkRef.current, chunk], { type: mimeType })
//         processChunk(assembled)
//       }
//       // Timeslice: balance latency vs. request count (800–1200ms is a sweet spot)
//       mr.start(900)

//       setCallOn(true)
//       setSpeakingActive(true)
//       // Enable voice replies while on a call
//       setTimeout(() => setSpeakEnabled(true), 0)

//       setCallSeconds(0)
//       if (callTimerRef.current) window.clearInterval(callTimerRef.current)
//       callTimerRef.current = window.setInterval(() => {
//         setCallSeconds((s) => s + 1)
//       }, 1000)
//     } catch {
//       alert("Microphone not available.")
//     }
//   }, [callOn, setSpeakEnabled])

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

//   useEffect(() => () => {
//     stopAudio()
//     // ensure resources released on unmount
//     try { mediaRecorderRef.current?.stop() } catch {}
//     try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
//     if (callTimerRef.current) window.clearInterval(callTimerRef.current)
//   }, [])

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
//               onClick={() => {
//                 // If user disables speak while TTS is playing, cut it immediately
//                 if (speakEnabled) stopAudio()
//                 setSpeakEnabled(!speakEnabled)
//               }}
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

//       <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-white">
//         {log.map((m, i) => (
//           <div key={i} className={m.from === "user" ? "text-right" : ""}>
//             <div className={`inline-block px-3 py-2 rounded-lg ${m.from === "user" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
//               {m.text}
//             </div>
//           </div>
//         ))}
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

//       <div className="sticky bottom-0 z-10 p-3 border-t bg-white">
//         {callOn && (
//           <div className="mb-2 flex justify-end">
//             <button
//               type="button"
//               onClick={async () => {
//                 if (speakingActive) {
//                   // User is stopping: wait for any in-flight chunk, then flush
//                   setSpeakingActive(false)
//                   await waitForQuiet(1000, 2000)
//                   const finalText = currentUtteranceRef.current.trim()
//                   currentUtteranceRef.current = ""
//                   lastAppendRef.current = ""
//                   // Skip if likely unrelated/noisy or too short
//                   if (finalText.length && !isLikelyUnrelated(finalText)) {
//                     await sendToChat(finalText)
//                   }
//                 } else {
//                   // User is starting to speak again: cut bot audio, clear buffer, resume capture
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
//             className="flex-1 border rounded-lg px-3 py-2"
//             value={msg}
//             onChange={(e) => setMsg(e.target.value)}
//             onKeyDown={onKeyDown}
//             placeholder="Ask about homes, neighborhoods, or mortgages..."
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
// Acceptance checklist (ChatCore):
// - Sticky input stays visible even when cards render.
// - Call Mode accumulates transcripts while "speaking" is active.
// - Stop speaking waits for a short drain, then sends the final utterance (and shows it in chat).
// - Bot replies show in text and, if enabled, play in voice. Toggling speak off immediately stops audio.
// - Starting to speak cuts off any current bot speech so users don't talk over it.
// */












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
import { PropertyCards } from "@/components/PropertyCards"
import { ChatMessageRenderer } from "@/components/chat/ChatMessageRenderer"
import type { ChatUISpec } from "@/lib/ui-spec"
import { stripBasicMarkdownArtifacts } from "@/lib/sanitize"

type ChatCoreProps = {
  defaultLang?: string
  initialOpen?: boolean
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

export const ChatCore = forwardRef<ChatCoreHandle, ChatCoreProps>(function ChatCore(props, ref) {
  const defaultLang = props.defaultLang || "en"
  const [msg, setMsg] = useState("")
  const [log, setLog] = useState<ChatMsg[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [uiSpec, setUiSpec] = useState<ChatUISpec | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false) // delayed mount + min visible
  const listRef = useRef<HTMLDivElement | null>(null)
  const indicatorTimers = useRef<{ delay?: number; min?: number }>({})
  const [speakEnabledUncontrolled, setSpeakEnabledUncontrolled] = useState(!!props.autoplayVoice)
  const speakEnabled = props.speakEnabled ?? speakEnabledUncontrolled
  const setSpeakEnabled = props.onSpeakEnabledChange ?? setSpeakEnabledUncontrolled

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

  // ====== Audio (TTS) control ======
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  const ttsPlayingRef = useRef(false)

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
      try {
        const mr = mediaRecorderRef.current
        if (mr && callOnRef.current && mr.state === "paused") mr.resume()
      } catch {}
    } catch {}
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
        try {
          const mr = mediaRecorderRef.current
          if (mr && mr.state === "recording") mr.pause()
        } catch {}
      }
      const clearTts = () => {
        ttsPlayingRef.current = false
        try {
          const mr = mediaRecorderRef.current
          if (mr && callOnRef.current && mr.state === "paused") mr.resume()
        } catch {}
      }
      a.onended = clearTts
      a.onpause = clearTts
      a.play().catch(() => {})
    } catch {}
  }

  useEffect(() => {
    if (!speakEnabled) stopAudio()
  }, [speakEnabled])

  // ====== Chat send (text & voice) ======
  const sendToChat = useCallback(
    async (text: string) => {
      const t = (text || "").trim()
      if (!t) return
      setLog((l) => [...l, { from: "user", text: t }])
      // Begin thinking with delay and minimum visible time
      try {
        setIsThinking(true)
        // show after 200ms
        indicatorTimers.current.delay && clearTimeout(indicatorTimers.current.delay)
        indicatorTimers.current.delay = window.setTimeout(() => setShowIndicator(true), 200)
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
        if (ct.includes("application/json")) {
          const json = await r.json()
          // complete
          setIsThinking(false)
          if (json && json.version === "1.0" && Array.isArray(json.blocks)) {
            setUiSpec(json as ChatUISpec)
            // Optional: add a lightweight confirmation message
            setLog((l) => [...l, { from: "bot", text: "Here are contact options." }])
          } else {
            const answer: string = json.answer || ""
            setLog((l) => [...l, { from: "bot", text: answer }])
            if (json.result?.items) setCards(json.result.items)
            if (speakEnabled) speak(answer)
          }
          return
        }

        // Stream text/plain
        if (ct.includes("text/plain") && r.body) {
          // while streaming, keep thinking on; it will stop after stream ends
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
              if (botIndex >= 0 && next[botIndex]) next[botIndex] = { from: "bot", text: cleaned }
              return next
            })
          }
          setIsThinking(false)
          if (speakEnabled) speak(acc)
          return
        }

        // Fallback: try JSON
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
        setLog((l) => [...l, { from: "bot", text: "Sorry, something went wrong." }])
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

  // Programmatic send hook: listen for app-wide event used by ChatWidget bus
  useEffect(() => {
    const onExternalSend = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text ?? ""
      const t = String(text || "").trim()
      if (!t) return
      // Enqueue without touching local input state
      ;(async () => {
        try { await sendToChat(t) } catch {}
      })()
    }
    window.addEventListener("cc-chatcore-send" as any, onExternalSend as any)
    return () => window.removeEventListener("cc-chatcore-send" as any, onExternalSend as any)
  }, [sendToChat])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      send()
    }
  }

  // Manage delayed show and minimum 1s visibility, with smooth fade-out
  useEffect(() => {
    if (isThinking) {
      // ensure we keep min visible once shown
      if (showIndicator) {
        indicatorTimers.current.min && clearTimeout(indicatorTimers.current.min)
        indicatorTimers.current.min = window.setTimeout(() => {
          // allow hide after 1s
        }, 1000)
      }
    } else {
      // thinking finished; if indicator is visible, keep for >=1s
      if (showIndicator) {
        // If no min timer exists, create one for 1s before hiding
        const hide = () => setShowIndicator(false)
        if (indicatorTimers.current.min) {
          const t = window.setTimeout(hide, 150) // small fade buffer
          indicatorTimers.current.min = undefined
          indicatorTimers.current.delay && clearTimeout(indicatorTimers.current.delay)
          indicatorTimers.current.delay = undefined
          return () => clearTimeout(t)
        } else {
          const t = window.setTimeout(() => setShowIndicator(false), 1000)
          return () => clearTimeout(t)
        }
      } else {
        // not visible yet; cancel pending delay
        indicatorTimers.current.delay && clearTimeout(indicatorTimers.current.delay)
        indicatorTimers.current.delay = undefined
      }
    }
    return () => {}
  }, [isThinking, showIndicator])

  // Auto-scroll to bottom when thinking or new messages
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [log, showIndicator])

  // ====== Call mode (mic + STT) ======
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
  useEffect(() => { speakingActiveRef.current = speakingActive }, [speakingActive])
  useEffect(() => { callOnRef.current = callOn }, [callOn])
  useEffect(() => { if (speakingActive) stopAudio() }, [speakingActive])

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
        // @ts-ignore
        if (typeof (window as any).MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c
      } catch {}
    }
    return undefined
  }

  // ====== STT Prompt & Filters ======
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
    const nonLatin = (t.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
    const totalLetters = (t.match(/[A-Za-z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
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
    /뉴스/gi,               // Korean "news"
    /이학수입니다/gi,        // common Korean sign-off
    /이덕영입니다/gi,
  ]
  const OFF_TOKENS = ["video", "channel", "podcast", "watching"]

  function stripBannedPhrases(s: string) {
    let t = s
    for (const re of BANNED_REGEX) t = t.replace(re, " ")
    // Collapse whitespace
    return t.replace(/\s{2,}/g, " ").trim()
  }

  function isLikelyUnrelated(text: string): boolean {
    const t = text.trim().toLowerCase()
    if (!t) return true
    const words = t.split(/\s+/).filter(Boolean).length
    if (t.length < 6 || words < 2) return true
    const offHits = OFF_TOKENS.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    if (offHits >= 2) return true
    return false
  }

  function sanitizeTranscriptForSend(raw: string) {
    // 1) Remove banned phrases inside mixed sentences
    let t = stripBannedPhrases(raw)
    if (!t) return ""

    // 2) Split into sentences; keep likely-relevant English (if defaultLang='en')
    const sentences = t.split(/(?<=[.!?])\s+|[\n\r]+/).map(s => s.trim()).filter(Boolean)
    const kept = sentences.filter(s =>
      !isLikelyUnrelated(s) &&
      !(defaultLang === "en" && isLikelyForeignForEnglish(s))
    )

    // 3) If nothing left, fallback to the longest fragment after stripping banned
    if (!kept.length) {
      const fragments = t.split(/[.!?\n\r]+/).map(s => s.trim()).filter(Boolean)
      const longest = fragments.sort((a, b) => b.length - a.length)[0] || ""
      return longest
    }

    // 4) Rejoin and tidy capitalization for a nice one-liner
    let out = kept.join(" ").replace(/\s{2,}/g, " ").trim()
    if (defaultLang === "en" && out) {
      out = out[0].toUpperCase() + out.slice(1)
      if (!/[.!?]$/.test(out)) out += "."
    }
    return out
  }

  async function waitForQuiet(idleMs = 900, maxMs = 1600) {
    try { mediaRecorderRef.current?.requestData() } catch {}
    const start = Date.now()
    let lastMark = lastSttAtRef.current
    while (Date.now() - start < maxMs) {
      const quietEnough = Date.now() - lastSttAtRef.current >= idleMs && !sttProcessingRef.current
      if (quietEnough) return
      if (lastMark !== lastSttAtRef.current) lastMark = lastSttAtRef.current
      await new Promise((r) => setTimeout(r, 110))
    }
  }

  const processChunk = useCallback(
    async (blob: Blob) => {
      if (!blob || blob.size === 0) return
      if (ttsPlayingRef.current) return
      if (sttProcessingRef.current) { lastChunkRef.current = blob; return }
      sttProcessingRef.current = true
      try {
        const fd = new FormData()
        const file = new File([blob], "chunk.webm", { type: "audio/webm" })
        fd.append("audio", file)
        fd.append("lang", defaultLang)
        fd.append("prompt", buildSttPrompt())
        const r = await fetch("/api/voice/stt", { method: "POST", body: fd }).then((r) => r.json())
        const raw = String(r?.text || "").trim()
        if (!callOnRef.current || !raw) {
          // ignore
        } else {
          // Strip banned phrases INSIDE mixed chunks so we can still keep useful bits
          let usable = stripBannedPhrases(raw)
          if (!usable) {
            // nothing left
          } else if (isLikelyUnrelated(usable)) {
            // background-y
          } else if (defaultLang === "en" && isLikelyForeignForEnglish(usable)) {
            // mostly non-Latin when we expect English
          } else if (speakingActiveRef.current) {
            if (usable !== lastAppendRef.current) {
              currentUtteranceRef.current = (currentUtteranceRef.current + " " + usable).trim()
              lastAppendRef.current = usable
              lastSttAtRef.current = Date.now()
            }
          }
        }
      } catch {
        // ignore per-chunk STT errors
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
        if (!headerChunkRef.current) { headerChunkRef.current = chunk; return }
        const mimeType = mr.mimeType || "audio/webm"
        const assembled = new Blob([headerChunkRef.current, chunk], { type: mimeType })
        processChunk(assembled)
      }
      // slice ~800–1000ms for latency vs. cost
      mr.start(850)

      setCallOn(true)
      setSpeakingActive(true)
      setTimeout(() => setSpeakEnabled(true), 0)

      setCallSeconds(0)
      if (callTimerRef.current) window.clearInterval(callTimerRef.current)
      callTimerRef.current = window.setInterval(() => setCallSeconds((s) => s + 1), 1000)
    } catch {
      alert("Microphone not available.")
    }
  }, [callOn, setSpeakEnabled, processChunk])

  const endCall = useCallback(() => {
    if (!callOn) return
    try { mediaRecorderRef.current?.stop() } catch {}
    try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
    mediaRecorderRef.current = null
    mediaStreamRef.current = null
    sttProcessingRef.current = false
    lastChunkRef.current = null
    headerChunkRef.current = null
    setSpeakingActive(false)
    currentUtteranceRef.current = ""
    lastAppendRef.current = ""
    if (callTimerRef.current) { window.clearInterval(callTimerRef.current); callTimerRef.current = null }
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

  useEffect(() => () => {
    stopAudio()
    try { mediaRecorderRef.current?.stop() } catch {}
    try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
    if (callTimerRef.current) window.clearInterval(callTimerRef.current)
  }, [])

  // Load last session (logged-in users only)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/chat/session', { method: 'GET' })
        if (!r.ok) return
        const { messages } = await r.json()
        if (cancelled || !Array.isArray(messages) || !messages.length) return
        // Reconstruct a minimal view: show text turns and the last UI spec if any
        const textTurns: { from: 'user' | 'bot'; text: string }[] = []
        let lastSpec: any = null
        for (const m of messages) {
          const role = m.role
          const content = m.content
          if (content && typeof content === 'object' && content.version === '1.0') {
            lastSpec = content
          } else if (content && typeof content === 'object' && typeof content.text === 'string') {
            if (role === 'user' || role === 'assistant') textTurns.push({ from: role === 'user' ? 'user' : 'bot', text: content.text })
          } else if (typeof content === 'string') {
            if (role === 'user' || role === 'assistant') textTurns.push({ from: role === 'user' ? 'user' : 'bot', text: content })
          }
        }
        if (textTurns.length) setLog(textTurns)
        if (lastSpec) setUiSpec(lastSpec)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  // Handle load more requests from PropertyResults
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {}
      const nextPage = Number(detail.page || 2)
      const rawQuery = String(detail.rawQuery || '')
      if (rawQuery) {
        // Re-send the same query text; server will use page param
        // Note: we include page in body by embedding it into the message format
        // The server reads body.page as well if client sets it explicitly.
        ;(async () => {
          const body: any = { message: rawQuery, session_id: session, lang: defaultLang, page: nextPage }
          const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          const ct = r.headers.get('Content-Type') || ''
          if (ct.includes('application/json')) {
            const json = await r.json()
            if (json?.version === '1.0') setUiSpec(json)
          }
        })().catch(() => {})
      }
    }
    window.addEventListener('cc-chat-load-more' as any, handler as any)
    return () => window.removeEventListener('cc-chat-load-more' as any, handler as any)
  }, [defaultLang, session])

  // ====== UI ======
  return (
    <div className="flex flex-col h-full min-h-0">
      {!props.hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="font-semibold">Crown Coastal AI</div>
          <div className="flex items-center gap-2">
            {callOn && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                ● Connected {String(Math.floor(callSeconds / 60)).padStart(2, "0")}:{String(callSeconds % 60).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              className={`text-sm px-2 py-1 rounded ${speakEnabled ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}
              onClick={() => { if (speakEnabled) stopAudio(); setSpeakEnabled(!speakEnabled) }}
              aria-label="Toggle voice replies"
              title="Toggle voice replies"
            >
              🔊
            </button>
            <button
              type="button"
              onClick={() => toggleCall()}
              className={`text-sm px-2 py-1 rounded ${callOn ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"}`}
              aria-label={callOn ? "End call" : "Start call"}
              title={callOn ? "End call" : "Start call"}
            >
              {callOn ? "End" : "🎤"}
            </button>
          </div>
        </div>
      )}

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-white">
        {log.map((m, i) => (
          <div key={i} className={m.from === "user" ? "text-right" : ""}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.from === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {showIndicator && (
          <div className="flex items-start">
            <div className="inline-block px-3 py-2 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800/80 dark:text-gray-100 transition-opacity duration-200">
              {/* three dots */}
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        {uiSpec && (
          <div className="pt-2">
            <ChatMessageRenderer spec={uiSpec} />
          </div>
        )}
        {cards.length > 0 && (
          <div className="pt-2" data-cc-one-col={props.hideHeader ? "1" : undefined}>
            <PropertyCards items={cards} />
          </div>
        )}
        {props.hideHeader ? (
          <style jsx global>{`
            [data-cc-one-col] .grid { grid-template-columns: 1fr !important; }
          `}</style>
        ) : null}
      </div>

  <div className="sticky bottom-0 z-10 p-3 border-t bg-white text-gray-900">
        {callOn && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={async () => {
                if (speakingActive) {
                  // Stopping: drain last chunk, sanitize, send
                  setSpeakingActive(false)
                  await waitForQuiet(900, 1600)
                  const finalRaw = currentUtteranceRef.current.trim()
                  currentUtteranceRef.current = ""
                  lastAppendRef.current = ""
                  const cleaned = sanitizeTranscriptForSend(finalRaw)
                  if (cleaned) await sendToChat(cleaned)
                } else {
                  // Starting again: cut any bot audio, clear buffer, resume
                  stopAudio()
                  currentUtteranceRef.current = ""
                  lastAppendRef.current = ""
                  setSpeakingActive(true)
                }
              }}
              className={`text-xs px-3 py-1 rounded ${speakingActive ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}
              aria-label={speakingActive ? "Stop speaking" : "Start speaking"}
              title={speakingActive ? "Stop speaking" : "Start speaking"}
            >
              {speakingActive ? "Stop speaking" : "Start speaking"}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about homes, listings, or viewings..."
            aria-label="Chat input"
          />
          <button
            onClick={send}
            disabled={isSending}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            aria-label="Send"
          >
            Send
          </button>
          <button
            onClick={() => toggleCall()}
            className={`px-3 py-2 rounded-lg border ${callOn ? "bg-red-50 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-gray-700"}`}
            aria-label={callOn ? "End call" : "Start call"}
            title={callOn ? "End call" : "Start call"}
          >
            {callOn ? "End" : "🎤"}
          </button>
        </div>
      </div>
    </div>
  )
})

/*
Key fixes:
- Pause mic while TTS plays (prevents "self-hearing").
- Strip banned phrases (YouTube outros, MBC 뉴스, etc.) INSIDE mixed chunks.
- Sanitize final utterance before sending to chat (keeps buyer intent, drops noise).
- Sticky input preserved.
*/
