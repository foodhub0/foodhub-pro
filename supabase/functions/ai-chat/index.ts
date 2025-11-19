import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Obter chave da API do ambiente
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

interface Message {
  role: string
  content: string
}

interface ChatRequest {
  messages: Message[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages }: ChatRequest = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required")
    }

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase Edge Function secrets.")
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em gestão de delivery e restaurantes, integrado ao sistema Food Hub.

Suas especialidades incluem:
- Análise de custos e precificação
- Estratégias para aumentar vendas
- Otimização de operações de delivery
- Gestão de estoque e ingredientes
- Criação de combos e promoções
- Análise de métricas e KPIs
- Dicas de marketing para delivery
- Gestão de cardápio

Sempre responda de forma:
- Profissional mas amigável
- Objetiva e prática
- Com exemplos quando possível
- Focada em resultados para o negócio
- Em português brasileiro

Se o usuário pedir insights, forneça análises baseadas em boas práticas do setor de delivery.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Erro ao conectar com a OpenAI")
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({
        message: data.choices[0].message.content
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )

  } catch (error) {
    console.error("Error in ai-chat function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
