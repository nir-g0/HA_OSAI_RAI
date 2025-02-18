import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Mic, MicOff, Loader2, WifiOff } from 'lucide-react'
import { RetellWebClient } from 'retell-client-js-sdk'
import { initializeRetellClient, registerCall } from '../lib/retell'

type Message = {
  id: string
  text: string
  sender: 'user' | 'ai'
}

interface VoiceChatProps {
  agentId: string
}

export default function VoiceChat ({ agentId }: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<string>('Idle')
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const clientRef = useRef<RetellWebClient | null>(null)
  const audioLevelIntervalRef = useRef<NodeJS.Timeout>()
  const [isConnected, setIsConnected] = useState(false)
  const [agentTalking, setAgentTalking] = useState(false)

  const cleanup = useCallback(async () => {
    setIsLoading(true)
    try {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current)
        audioLevelIntervalRef.current = undefined
      }

      if (clientRef.current) {
        clientRef.current.stopCall()
        clientRef.current = null
      }
    } catch (err) {
      console.error('Error during cleanup:', err)
      setError(err instanceof Error ? err.message : 'Cleanup failed')
    } finally {
      //delete agent after session
      setIsConnected(false)
      setIsRecording(false)
      setStatus('Disconnected')
      setAudioLevel(0)
      setIsLoading(false)
    }
  }, [])

  const handleVoiceToggle = async () => {
    if (isRecording) {
      setStatus('Disconnecting...')
      await cleanup()
    } else {
      initVoiceChat()
    }
  }

  useEffect(() => {
    return () => {
      if (isConnected) {
        cleanup()
      }
    }
  }, [isConnected, cleanup])

  const initVoiceChat = async () => {
    if (!agentId) {
      setError('Agent ID is not set')
      return
    }

    await cleanup()
    setStatus('Initializing...')
    setError(null)
    setIsLoading(true)

    try {
      const llmResponse = await fetch(
        'http://localhost:8080/create-retell-llm',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: 'You are a computer science professor' // <---
          })
        }
      )

      const llm = await llmResponse.json()
      const llm_id = llm.llm_id

      const agentResponse = await fetch('http://localhost:8080/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          llm_id: llm_id
        })
      })

      const agent = await agentResponse.json()
      const newAgentId = agent.agent_id

      const registerCallResponse = await registerCall(newAgentId)

      if (registerCallResponse.access_token) {
        clientRef.current = initializeRetellClient()
        await clientRef.current.startCall({
          accessToken: registerCallResponse.access_token
        })

        setStatus('Connected! Start speaking...')
        setIsRecording(true)
        setIsConnected(true)
        
        audioLevelIntervalRef.current = setInterval(() => {
          setAudioLevel(Math.random())
        }, 100)
      }
    } catch (err) {
      console.error('Voice chat error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to connect to voice chat'
      )
      setStatus('Error connecting')
      setIsRecording(false)
      cleanup()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className='w-full max-w-md mx-auto h-[400px] overflow-hidden border-none bg-white/10 backdrop-blur-lg shadow-2xl'>
      <CardHeader className='pb-4 relative'>
        <div className='absolute inset-0 bg-gradient-to-b from-white/10 to-transparent'></div>
        <CardTitle className='relative flex items-center justify-between text-2xl font-light tracking-tight text-white'>
          <span className='flex items-center gap-3 w-full justify-center'>
            Voice Assistant
            {isLoading && (
              <Loader2 className='h-4 w-4 animate-spin text-white/70' />
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col items-center justify-between h-[300px] px-8'>
        <div className='text-center w-full flex flex-col items-center gap-6'>
          <div
            className={`text-lg font-light transition-colors duration-300 ${
              isRecording
                ? 'text-white'
                : isLoading
                ? 'text-white/70'
                : 'text-white/50'
            }`}
          >
            {status}
          </div>

          <Button
            onClick={handleVoiceToggle}
            size='lg'
            className={`
              w-24 h-24 rounded-full transition-colors duration-500 
              ${
                isRecording
                  ? 'bg-red-500/20 hover:bg-red-500/30'
                  : 'bg-white/10 hover:bg-white/20'
              } 
              border-none shadow-xl hover:shadow-2xl
              flex items-center justify-center
              group
            `}
            disabled={isLoading}
          >
            {isRecording ? (
              <MicOff className='h-8 w-8 text-red-500 transition-transform duration-300 group-hover:scale-110' />
            ) : (
              <Mic className='h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110' />
            )}
          </Button>

          <div className='h-12 flex items-center justify-center'>
            {isRecording ? (
              <div className='flex justify-center items-center space-x-1'>
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className='w-1 bg-white/30 rounded-full animate-pulse'
                    style={{
                      height: `${Math.max(12, Math.random() * 48)}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.5s'
                    }}
                  />
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className='flex justify-center items-center gap-2 text-white/50'>
                  <WifiOff className='h-4 w-4' />
                  <span className='text-sm font-light'>Ready to start</span>
                </div>
              )
            )}
          </div>

          {error && (
            <div className='text-red-300/90 text-sm bg-red-500/10 p-4 rounded-2xl backdrop-blur-sm'>
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
