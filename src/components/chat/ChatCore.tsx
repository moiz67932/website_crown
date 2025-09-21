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
//       a.play().catch(() => {})
//     } catch (e) {
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
//       if (!text.trim()) return
//       setLog((l) => [...l, { from: "user", text }])
//       try {
//         const body: any = {
//           message: text,
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
//         if (speakEnabled) speak(answer)
//       } catch (e) {
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

//   // Notify parent (ChatWidget) of call state changes after render commit to avoid setState in render warnings
//   useEffect(() => {
//     // Defer to next tick to be extra safe in concurrent rendering modes
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

//   const processChunk = useCallback(
//     async (blob: Blob) => {
//       if (!blob || blob.size === 0) return
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
//         const r = await fetch("/api/voice/stt", { method: "POST", body: fd }).then((r) => r.json())
//         const text: string = r?.text || ""
//         const cleaned = text.trim()
//         if (!callOn || !cleaned) {
//           // ignore
//         } else if (speakingActive) {
//           // Append to current utterance, suppress immediate duplicates
//           if (cleaned !== lastAppendRef.current) {
//             currentUtteranceRef.current = (currentUtteranceRef.current + " " + cleaned).trim()
//             lastAppendRef.current = cleaned
//           }
//         } else {
//           // Ignore partials while paused
//         }
//       } catch {}
//       finally {
//         sttProcessingRef.current = false
//         if (lastChunkRef.current) {
//           const next = lastChunkRef.current
//           lastChunkRef.current = null
//           // Tail-call to process the latest queued chunk
//           processChunk(next)
//         }
//       }
//     },
//     [callOn, sendToChat]
//   )

//   const startCall = useCallback(async () => {
//     if (callOn) return
//     try {
//       if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
//         alert("Microphone not available.")
//         return
//       }
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       mediaStreamRef.current = stream
//       const mime = getBestMime()
//       const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
//       mediaRecorderRef.current = mr
//       mr.ondataavailable = (ev: BlobEvent) => {
//         const chunk = ev.data
//         if (!chunk || chunk.size === 0) return
//         // Save header on first emission; don't send yet (need content + header)
//         if (!headerChunkRef.current) {
//           headerChunkRef.current = chunk
//           return
//         }
//         // Prepend header to ensure a valid standalone WebM/Opus file per request
//         const mimeType = mr.mimeType || "audio/webm"
//         const assembled = new Blob([headerChunkRef.current, chunk], { type: mimeType })
//         processChunk(assembled)
//       }
//   // emit smaller chunks to reduce latency while buffering
//   mr.start(800)
//       setCallOn(true)
//       // Defer updating parent speak toggle to avoid setState during child render
//       setTimeout(() => setSpeakEnabled(true), 0) // auto-enable speak in call
//   setSpeakingActive(true)
//       setCallSeconds(0)
//       if (callTimerRef.current) window.clearInterval(callTimerRef.current)
//       callTimerRef.current = window.setInterval(() => {
//         setCallSeconds((s) => s + 1)
//       }, 1000)
//     } catch (e) {
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
//               onClick={() => setSpeakEnabled(!speakEnabled)}
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
//                   const finalText = currentUtteranceRef.current.trim()
//                   currentUtteranceRef.current = ""
//                   lastAppendRef.current = ""
//                   setSpeakingActive(false)
//                   if (finalText.length) await sendToChat(finalText)
//                 } else {
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
// - Sends messages to /api/chat with session_id; renders replies and PropertyCards when result.items present.
// - Call Mode toggles continuous MediaRecorder; sends chunks to /api/voice/stt with basic noise filter; auto-sends to /api/chat.
// - TTS toggle posts to /api/voice/tts and plays audio; overlapping audio is handled by stopping previous.
// - No server-only imports; Tailwind only.
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

  // Audio refs for TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  // When TTS is playing, we pause the recorder and ignore STT to avoid feedback
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
      // Clear TTS flag and resume recorder if it was paused
      ttsPlayingRef.current = false
      try {
        const mr = mediaRecorderRef.current
        if (mr && callOnRef.current && mr.state === "paused") mr.resume()
      } catch {}
    } catch {}
  }

  const speak = async (text: string) => {
    if (!speakEnabled || !text) return
    // stop any previous speech before starting a new one
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
      // Pause recorder while TTS is playing to avoid transcribing the bot
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
    } catch {
      // ignore tts failures
    }
  }

  // If speak is disabled while audio is playing, stop playback immediately
  useEffect(() => {
    if (!speakEnabled) stopAudio()
  }, [speakEnabled])

  // Unified send-to-chat for both text and voice pathways (does not toggle isSending/UI state)
  const sendToChat = useCallback(
    async (text: string) => {
      const t = (text || "").trim()
      if (!t) return
      setLog((l) => [...l, { from: "user", text: t }])
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
        }).then((r) => r.json())
        const answer: string = r.answer || ""
        setLog((l) => [...l, { from: "bot", text: answer }])
        if (r.result?.items) setCards(r.result.items)
        if (speakEnabled) speak(answer) // reply in voice too
      } catch {
        setLog((l) => [...l, { from: "bot", text: "Sorry, something went wrong." }])
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

  // Enter key to send
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      send()
    }
  }

  // Call Mode: continuous MediaRecorder + STT queue
  const [callOn, setCallOn] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const callTimerRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sttProcessingRef = useRef(false)
  const lastChunkRef = useRef<Blob | null>(null)
  // Keep the first chunk, which generally contains the WebM/Opus container header
  const headerChunkRef = useRef<Blob | null>(null)
  // Speaking session buffer: accumulate transcripts until user stops speaking
  const [speakingActive, setSpeakingActive] = useState(false)
  const currentUtteranceRef = useRef<string>("")
  const lastAppendRef = useRef<string>("")
  // Refs to avoid stale closures inside MediaRecorder callbacks
  const speakingActiveRef = useRef(false)
  const callOnRef = useRef(false)
  useEffect(() => { speakingActiveRef.current = speakingActive }, [speakingActive])
  useEffect(() => { callOnRef.current = callOn }, [callOn])
  // If user begins speaking, immediately cut off any bot speech
  useEffect(() => { if (speakingActive) stopAudio() }, [speakingActive])

  // Inform parent (widget shell) about call state
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

  // Domain prompt to bias Whisper toward real-estate queries and ignore background media
  function buildSttPrompt() {
    return [
      "You are transcribing a real estate buyer conversation.",
      "Ignore background media, ads, podcasts, YouTube endings like 'thanks for watching', 'share this video', or other unrelated chatter.",
      "Prefer English unless the user clearly speaks another language.",
      "Transcribe concise buyer intent like 'I want to buy properties in California'.",
    ].join(" ")
  }

  // Gating by character script (when default language is English)
  function isLikelyForeignForEnglish(text: string): boolean {
    const t = text || ""
    // Count non-Latin scripts (CJK + Hangul + Kana)
    const nonLatin = (t.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
    const totalLetters = (t.match(/[A-Za-z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
    if (totalLetters === 0) return false
    const ratio = nonLatin / totalLetters
    // If majority is non-Latin and our default language is English, treat as foreign/background
    return ratio > 0.4
  }

  // Heuristic filter to drop unrelated/noisy transcripts (e.g., background videos)
  function isLikelyUnrelated(text: string): boolean {
    const t = text.trim().toLowerCase()
    if (!t) return true
    // Very short blips are likely noise
    const wordCount = t.split(/\s+/).filter(Boolean).length
    if (t.length < 6 || wordCount < 2) return true
    // Common background phrases from videos/podcasts/YouTube
    const banned = [
      /thanks? for watching/,
      /thank you for watching/,
      /like and subscribe/,
      /share this video/,
      /share this video with your friends/,
      /subscribe( to| on)? (the )?channel/,
      /hit the bell/,
      /smash that like/,
      /bye( guys| everyone| sam)?/,
      /bruh/,
      /today we'?re going to/,
      /mbc/,
      /뉴스/, // Korean "news"
    ]
    if (banned.some((re) => re.test(t))) return true
    const offTokens = ["video", "channel", "podcast"]
    const hits = offTokens.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    if (hits >= 2) return true
    return false
  }

  // Helper: wait for STT pipeline to drain briefly (so last chunk is included)
  async function waitForDrain(timeoutMs = 900) {
    const start = Date.now()
    // Wait while a chunk is being processed
    while (sttProcessingRef.current && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 80))
    }
    // Small grace to allow the tail chunk to enqueue and process
    await new Promise((r) => setTimeout(r, 140))
  }

  const processChunk = useCallback(
    async (blob: Blob) => {
      if (!blob || blob.size === 0) return
      // Ignore chunks while TTS is playing to prevent self-hearing
      if (ttsPlayingRef.current) return
      if (sttProcessingRef.current) {
        lastChunkRef.current = blob
        return
      }
      sttProcessingRef.current = true
      try {
        const fd = new FormData()
        // Force stable webm container for Whisper
        const file = new File([blob], "chunk.webm", { type: "audio/webm" })
        fd.append("audio", file)
        fd.append("lang", defaultLang)
        fd.append("prompt", buildSttPrompt())
        const r = await fetch("/api/voice/stt", { method: "POST", body: fd }).then((r) => r.json())
        const text: string = r?.text || ""
        const cleaned = text.trim()
        if (!callOnRef.current || !cleaned) {
          // ignore empty or if call already ended
        } else {
          // Drop unrelated/noisy transcripts
          if (isLikelyUnrelated(cleaned)) {
            // ignore background media
          } else
          if (defaultLang === "en" && isLikelyForeignForEnglish(cleaned)) {
            // ignore mostly non-Latin chunks when expecting English
          } else
          // We accumulate only when 'speaking' is active to mirror push-to-talk UX.
          // (If you want continuous dictation, remove the speakingActive check.)
          if (speakingActiveRef.current) {
            if (cleaned !== lastAppendRef.current) {
              currentUtteranceRef.current = (currentUtteranceRef.current + " " + cleaned).trim()
              lastAppendRef.current = cleaned
            }
          }
        }
      } catch {
        // ignore STT errors per-chunk
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
      // If bot is speaking, cut it off when we begin to speak
      stopAudio()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as MediaTrackConstraints,
      })
      mediaStreamRef.current = stream
      const mime = getBestMime()
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (ev: BlobEvent) => {
        const chunk = ev.data
        if (!chunk || chunk.size === 0) return
        // Cache header chunk once; we'll prepend it to each subsequent chunk
        if (!headerChunkRef.current) {
          headerChunkRef.current = chunk
          return
        }
        const mimeType = mr.mimeType || "audio/webm"
        const assembled = new Blob([headerChunkRef.current, chunk], { type: mimeType })
        processChunk(assembled)
      }
      // Timeslice: balance latency vs. request count (800–1200ms is a sweet spot)
      mr.start(900)

      setCallOn(true)
      setSpeakingActive(true)
      // Enable voice replies while on a call
      setTimeout(() => setSpeakEnabled(true), 0)

      setCallSeconds(0)
      if (callTimerRef.current) window.clearInterval(callTimerRef.current)
      callTimerRef.current = window.setInterval(() => {
        setCallSeconds((s) => s + 1)
      }, 1000)
    } catch {
      alert("Microphone not available.")
    }
  }, [callOn, setSpeakEnabled])

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

  useEffect(() => () => {
    stopAudio()
    // ensure resources released on unmount
    try { mediaRecorderRef.current?.stop() } catch {}
    try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
    if (callTimerRef.current) window.clearInterval(callTimerRef.current)
  }, [])

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
              onClick={() => {
                // If user disables speak while TTS is playing, cut it immediately
                if (speakEnabled) stopAudio()
                setSpeakEnabled(!speakEnabled)
              }}
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

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-white">
        {log.map((m, i) => (
          <div key={i} className={m.from === "user" ? "text-right" : ""}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.from === "user" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
              {m.text}
            </div>
          </div>
        ))}
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

      <div className="sticky bottom-0 z-10 p-3 border-t bg-white">
        {callOn && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={async () => {
                if (speakingActive) {
                  // User is stopping: wait for any in-flight chunk, then flush
                  setSpeakingActive(false)
                  await waitForDrain(900)
                  const finalText = currentUtteranceRef.current.trim()
                  currentUtteranceRef.current = ""
                  lastAppendRef.current = ""
                  // Skip if likely unrelated/noisy or too short
                  if (finalText.length && !isLikelyUnrelated(finalText)) {
                    await sendToChat(finalText)
                  }
                } else {
                  // User is starting to speak again: cut bot audio, clear buffer, resume capture
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
            className="flex-1 border rounded-lg px-3 py-2"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about homes, neighborhoods, or mortgages..."
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
Acceptance checklist (ChatCore):
- Sticky input stays visible even when cards render.
- Call Mode accumulates transcripts while "speaking" is active.
- Stop speaking waits for a short drain, then sends the final utterance (and shows it in chat).
- Bot replies show in text and, if enabled, play in voice. Toggling speak off immediately stops audio.
- Starting to speak cuts off any current bot speech so users don't talk over it.
*/
