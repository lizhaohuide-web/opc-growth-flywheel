'use client'
import { useState, useRef } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onChange?: (text: string) => void
  language?: 'zh-CN' | 'en-US'
}

export default function VoiceInput({
  onTranscript,
  onChange,
  language = 'zh-CN',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const startListening = () => {
    setError(null)
    setTranscript('')

    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setError('您的浏览器不支持语音识别，请使用 Chrome 浏览器')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language

      recognition.onresult = (event: any) => {
        let currentFinalTranscript = ''
        
        // 获取本次识别的最终结果
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentFinalTranscript += event.results[i][0].transcript
          }
        }

        if (currentFinalTranscript) {
          console.log('识别到语音:', currentFinalTranscript)
          // 实时追加到编辑器
          if (onChange) {
            onChange(currentFinalTranscript)
          } else {
            onTranscript(currentFinalTranscript)
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error)
        if (event.error === 'no-speech') {
          setError('未检测到语音，请对着麦克风说话')
        } else if (event.error === 'audio-capture') {
          setError('未找到麦克风，请检查设备')
        } else if (event.error === 'not-allowed') {
          setError('麦克风权限被拒绝，请在浏览器设置中允许麦克风权限')
        } else {
          setError(`语音识别错误：${event.error}`)
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log('语音识别结束，最终结果:', transcript)
        setIsListening(false)
        if (transcript) {
          // 优先使用 onChange，其次使用 onTranscript
          if (onChange) {
            onChange(transcript)
          } else {
            onTranscript(transcript)
          }
        }
      }

      recognition.start()
      setIsListening(true)
      console.log('语音识别已启动')
    } catch (err) {
      console.error('启动语音识别失败:', err)
      setError('启动语音识别失败，请重试')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    console.log('手动停止语音识别，结果:', transcript)
    setIsListening(false)
    if (transcript) {
      if (onChange) {
        onChange(transcript)
      } else {
        onTranscript(transcript)
      }
    }
    setTranscript('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
        }`}
        style={isListening ? {} : { border: '1px solid var(--border-subtle)' }}
      >
        {isListening ? (
          <>
            <span className="text-base">🔴</span>
            <span>录音中...</span>
            {transcript && (
              <span className="text-xs opacity-80 ml-2">
                {transcript.length} 字
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-base">🎤</span>
            <span>语音输入</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 rounded-lg text-xs bg-red-500 text-white z-50">
          {error}
        </div>
      )}
    </div>
  )
}
