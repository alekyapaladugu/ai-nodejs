import { openai } from "./openai.js";
import math from 'advanced-calculator'
const QUESTION = process.argv[2] || 'hi'

const messages = [
    {
        role: 'system',
        content:
          "You are a helpful AI assistant. Answser questions to your best ability. Call the 'calculate' function to evaluate math expressions.",
    },
    {
      role: 'user',
      content: QUESTION,
    },
  ]

const functions = {
    calculate: ({ expression }) => {
        return math.evaluate(expression)
      }
}

const tools = [{
    type: 'function',
    function: {
        name: 'calculate',
        description: 'Run a math expression',
        parameters: {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: 'The math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
                }
            },
            required: ['expression'],
        }
    }
    
}]

const getCompletion = async (messages) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      tools,
      temperature: 0,
    })
  
    return response
  }


  let response
  while (true) {
    response = await getCompletion(messages)

    if (response.choices[0].finish_reason === 'stop') {
      console.log(response.choices[0].message.content)
      break
    } else if (response.choices[0].finish_reason === 'tool_calls') {
      const fnName = response.choices[0].message.tool_calls[0].function.name
      const args = response.choices[0].message.tool_calls[0].function.arguments
      const functionToCall = functions[fnName]
      const params = JSON.parse(args)
      const result = functionToCall(params)
  
      messages.push({
        role: 'assistant',
        content: null,
        function_call: {
          name: fnName,
          arguments: args,
        },
      })
  
      messages.push({
        role: 'function',
        name: fnName,
        content: JSON.stringify({ result: result }),
      })
    }
  }
  
