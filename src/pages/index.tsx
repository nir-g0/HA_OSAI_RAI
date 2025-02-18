import { useState, useEffect } from 'react'
import VoiceChat from '../components/VoiceChat'
import { Card, CardContent } from '../components/ui/card'
import LoadingSpinner from '../components/LoadingSpinner'
import React from 'react'

export default function HomePage () {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const llmResponse = await fetch(
          'http://localhost:8080/create-retell-llm',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: 'You are a computer science professor'
            })
          }
        )

        const llm = await llmResponse.json()
        const llm_id = llm.llm_id

        const agentResponse = await fetch(
          'http://localhost:8080/create-agent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              llm_id: llm_id
            })
          }
        )

        const agent = await agentResponse.json()
        setAgentId(agent.agent_id)
      } catch (err) {
        console.error('Error initializing agent:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to initialize agent'
        )
      } finally {
        setIsLoading(false)
      }
    }

    initializeAgent()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center'>
      <div className='max-w-2xl w-full mx-auto space-y-6'>
        {error ? (
          <Card className='bg-white/10 backdrop-blur-lg border-none'>
            <CardContent className='p-6'>
              <div className='text-red-300/90 text-center font-light p-4 rounded-2xl bg-red-500/10'>
                {error}
              </div>
            </CardContent>
          </Card>
        ) : !agentId ? (
          <Card className='bg-white/10 backdrop-blur-lg border-none'>
            <CardContent className='p-6'>
              <div className='text-white/70 text-center font-light p-4'>
                <div className='animate-pulse'>Initializing...</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <VoiceChat agentId={agentId} />
        )}
      </div>
    </main>
  )
}
