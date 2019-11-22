import uuid from 'uuid'
import Documents from '@inshel/documents'

export default async ({ node, key, contract }, lambda, params, keyId) => {
  const documents = new Documents(node, { key })
  
  switch (lambda) {
    case 'contracts.sign-up':
      return true

    case 'rays.subscribe':
      if (params == null || !Array.isArray(params.rays)) {
        throw new Error('Invalid params')
      }

      return params.rays.map(() => true)

    case 'messages':
      if (params == null 
        || typeof params.chat !== 'string' 
        || params.chat.length === 0
        || params.chat.length > 128
      ) {
        throw new Error('Invalid params')
      }

      const { documents: messages } = await documents.q(
        `CHATS#${params.chat}`, 
        [], 
        { limit: params.limit, offset: params.offset }
      )
      return messages.map(({ id: document, token, payload: { author, message } }) => (
        { document, token, author, message }
      ))
    
    case 'message':
      if (params == null 
        || typeof params.chat !== 'string' 
        || params.chat.length === 0
        || params.chat.length > 128
        || typeof params.message !== 'string'
        || params.message.length === 0
        || params.message.length > 4096
      ) {
        throw new Error('Invalid params')
      }
      
      const token = uuid.v4()
      const { id: document } = await documents.upsert(
        { 
          space: `CHATS#${params.chat}`, 
          token, 
          payload: { author: keyId, message: params.message }, 
          tokens: {} 
        }
      )

      const result = { document, author: keyId, message: params.message, token }
      await node.rays.message(
        key, 
        contract, 
        `CHATS#${params.chat}`, 
        JSON.stringify(result)
      )
      return result

    default:
      return null
  }
}