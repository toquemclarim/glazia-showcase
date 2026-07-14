import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  CHAT_PROMPTS,
  gerarRespostaChat,
  type ChatPrompt,
} from '../utils/chatResponses'

interface Message {
  id: string
  role: 'bot' | 'user'
  text: string
}

const WELCOME =
  'Como a Glazia pode te ajudar hoje?\n\nEscolha uma das opções abaixo — analiso seus dados em segundos.'

export function AiChat() {
  const { lancamentos, despesas, usuario } = useApp()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', text: WELCOME },
  ])
  const [typing, setTyping] = useState(false)
  const [used, setUsed] = useState<Set<string>>(new Set())
  const endRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  if (!usuario) return null

  const ask = (prompt: ChatPrompt) => {
    if (typing) return

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: prompt },
    ])
    setUsed((prev) => new Set(prev).add(prompt))
    setTyping(true)

    const delay = 700 + Math.random() * 700
    window.setTimeout(() => {
      const resposta = gerarRespostaChat(prompt, lancamentos, despesas)
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'bot', text: resposta },
      ])
      setTyping(false)
    }, delay)
  }

  const remaining = CHAT_PROMPTS.filter((p) => !used.has(p))

  return (
    <div className="ai-chat-root">
      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-chat-panel glass"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="ai-chat-header">
              <div className="ai-chat-header-brand">
                <img src="/logo.png" alt="" className="ai-chat-avatar" />
                <div>
                  <strong>Glazia IA</strong>
                  <span>Assistente financeiro</span>
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar chat"
              >
                <X size={16} />
              </button>
            </header>

            <div className="ai-chat-messages" ref={listRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-chat-row ${msg.role === 'bot' ? 'bot' : 'user'}`}
                >
                  {msg.role === 'bot' && (
                    <img src="/logo.png" alt="Glazia" className="ai-chat-bubble-avatar" />
                  )}
                  <div className={`ai-chat-bubble ${msg.role}`}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="ai-chat-row bot">
                  <img src="/logo.png" alt="Glazia" className="ai-chat-bubble-avatar" />
                  <div className="ai-chat-bubble bot typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="ai-chat-prompts">
              <p className="ai-chat-prompts-label">Perguntas rápidas</p>
              <div className="ai-chat-prompts-list">
                {(remaining.length ? remaining : CHAT_PROMPTS).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-chat-prompt-btn"
                    disabled={typing}
                    onClick={() => ask(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={`ai-chat-fab${open ? ' open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar assistente Glazia' : 'Abrir assistente Glazia'}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        animate={{ y: [0, -6, 0] }}
        transition={{
          y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.15 },
        }}
      >
        {open ? (
          <MessageCircle size={22} />
        ) : (
          <img src="/logo.png" alt="Glazia" />
        )}
        {!open && <span className="ai-chat-fab-pulse" />}
      </motion.button>
    </div>
  )
}
