import uuid from 'uuid'
import Documents from '@inshel/documents'

const STATUSES = [
  'DONE',
  'UNDONE'
]
STATUSES.DONE = STATUSES[0]
STATUSES.UNDONE = STATUSES[1]

export default async ({ node, key, contract }, lambda, params, keyId) => {
  const documents = new Documents(node, { key })
  
  switch (lambda) {
    case 'tasks':
      if (params == null || STATUSES.indexOf(params.status) < 0) {
        throw new Error('Invalid params')
      }

      const { documents: tasks } = await documents.q(
        `TASKS#${keyId}:${params.status}`, 
        [], 
        { limit: params.limit, offset: params.offset }
      )
      return tasks.map(({ id: document, token, payload: { title, status } }) => (
        { document, token, title, status }
      ))

    case 'task':
      if (params == null 
        || typeof params.title !== 'string'
        || params.title.length === 0
        || params.title.length > 4096
        || STATUSES.indexOf(params.status) < 0
        || (params.token != null && typeof params.token !== 'string')
      ) {
        throw new Error('Invalid params')
      }
      
      const token = params.token == null ? uuid.v4() : params.token
      const { id: document } = await documents.upsert(
        { 
          space: `TASKS#${keyId}:${params.status}`, 
          token, 
          payload: { title: params.title }, 
          tokens: { }
        }
      )

      const result = { document, token, title: params.title, status: params.status }
      await node.rays.message(
        key, 
        contract, 
        `TASKS#${keyId}`, 
        JSON.stringify(result)
      )
      return result

    case 'task.changeStatus':
      if (params == null || typeof params.id !== 'number' || STATUSES.indexOf(params.status) < 0) {
        throw new Error('Invalid params')
      }

      const oldStatus = params.status === STATUSES.DONE ? STATUSES.UNDONE : STATUSES.DONE
      const { documents: [ currentDocument ] } = await documents.q(
        `TASKS#${keyId}:${oldStatus}`, 
        [], 
        { limit: 1, offset: 0, id: params.id }
      )

      if (currentDocument == null) {
        throw new Error('Document not found')
      }
      await documents.changeSpace(currentDocument.id, `TASKS#${keyId}:${params.status}`)
      
      const rayMessage = { 
        document: currentDocument.id, 
        token: currentDocument.token, 
        title: currentDocument.payload.title, 
        status: params.status
      }
      await node.rays.message(
        key, 
        contract, 
        `TASKS#${keyId}`, 
        JSON.stringify(rayMessage)
      )
      return rayMessage

    default:
      return null
  }
}