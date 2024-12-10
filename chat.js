import { openai } from './openai.js'
import readline from 'node:readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const newMessage = async (history, message) => {
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [ ...history, message]
    })

    return response.choices[0].message
}

const formatMessage = (userInput) => ({
    role: 'user',
    content: userInput
})

export const chat = () => {
    const history = [
        {
            role: 'system',
            content: 'You are an AI assisstant, answer any questions to the best of your ability.'
        },
    ]

    const start = () => {
        rl.question('You: ', async (userInput) => {
            if(userInput.toLowerCase() === 'exit') {
                rl.close()
                return
            }
            const userMessage = formatMessage(userInput)
            const response = await newMessage(history, userMessage)
            history.push(userMessage, response)
            console.log(`\n\nAI: ${response.content}\n\n`)
            start()
        })

    }
    start()
}
console.log("Chatbot initialized. Type 'exit' to quit.")


   