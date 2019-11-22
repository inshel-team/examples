import Node from '@inshel/node'
import FLocalStorage from 'fallback-local-storage'
import JSEncrypt from 'jsencrypt'
import React from 'react'

const ls = new FLocalStorage()

const useChats = (config) => {
  const nodeRef = React.useRef(null)
  const [ state, dispatch ] = React.useReducer(reducer, defaultState(config))
  const actions = new Actions(nodeRef, dispatch)

  React.useEffect(() => {
    const effect = async () => {
      const node = new Node()
      node.config = config
      nodeRef.current = node

      await node.connect()

      let { privateKey } = state
      
      // Sign up
      if (privateKey == null) {
        const newKey = new JSEncrypt()
        privateKey = newKey.getPrivateKey()

        await node.contractKeys.signUp(state.contract, newKey.getPublicKey(), {})
      }

      // Sign in
      const encryptKey = new JSEncrypt()
      encryptKey.setPrivateKey(privateKey)

      const { key } = await node.keys.approve(encryptKey)
      node.key = key

      // Subscribe
      await Promise.all(state.chats.map(({ ray }) => 
        node.rays.subscribe(
          key, 
          { contract: config.contract, ray: `CHATS#${ray}` }, 
          (_, __, messageStr) => {
            try {
              const message = JSON.parse(messageStr)
              message.my = message.author === node.key

              actions.messages(ray, [ message ], 'end')
            } catch (e) {
              console.error(e)
            }
          }
        )
      ))

      actions.merge({ status: 'connected', privateKey })
    }

    effect().catch((e) => { 
      console.error(e)
    })
  }, [])

  return {
    state,
    actions
  }
}

const reducerBase = (state, action) => {
  switch (action.type) {
    case Actions.TYPES.MERGE:
      return {
        ...state,
        ...action.payload
      }

    case Actions.TYPES.JOIN:
      return {
        ...state,
        activeChat: action.payload.chat,
        chats: (
          state.chats.find(({ ray }) => ray === action.payload.chat) == null  
            ? [ { ray: action.payload.chat, messages: [], new: 0, messagesIds: {} } ]
            : [ ]
        ).concat(state.chats)
      }

    case Actions.TYPES.REMOVE:
      return {
        ...state,
        activeChat: state.activeChat === action.payload.chat ? null : state.activeChat,
        chats: state.chats.filter(({ ray }) => ray !== action.payload.chat)
      }

    case Actions.TYPES.BUSY:
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.ray !== action.payload.chat) {
            return chat
          }

          return { ...chat, isBusy: action.payload.value }
        })
      }
    
    case Actions.TYPES.MESSAGES:
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.ray !== action.payload.chat) {
            return { ...chat }
          }

          const newMessagesIds = { ...chat.messagesIds }
          const newMessages = action.payload.messages.filter(({ document }) => {
            if (newMessagesIds[document]) {
              return false
            }

            newMessagesIds[document] = true
            return true
          })

          return {
            ...chat,
            isBusy: false,
            messagesIds: newMessagesIds,
            new: 
              chat.new + (action.payload.position === 'start' 
              || state.activeChat === action.payload.chat
                ? 0 
                : newMessages.length
            ),
            messages: action.payload.position === 'start' 
              ? newMessages.concat(chat.messages)
              : chat.messages.concat(newMessages)
          }
        })
      }

    case Actions.TYPES.ACTIVE:
      return {
        ...state,
        activeChat: action.payload.chat,
        chats: state.chats.map((chat) => {
          if (chat.ray !== action.payload.chat) {
            return { ...chat }
          }

          return { ...chat, new: 0 }
        })
      }

    default:
      throw new Error(`Unhandled action type: ${JSON.stringify(action.type)}`)  
  }
}

const reducer = (...args) => {
  const ls = new FLocalStorage()

  const newState = reducerBase(...args)
  ls.setItem(
    'chats', 
    JSON.stringify({ 
      privateKey: newState.privateKey, 
      chats: newState.chats.map(({ ray }) => ray)
    })
  )

  return newState
}

const defaultState = (config) => {
  const fromLocalStorage = JSON.parse(ls.getItem('chats') || JSON.stringify({ chats: [] }))
  
  const result = {
    contract: config.contract,
    status: 'disconnected',
    provateKey: null,
    activeChat: null,
    error: null,
    ...fromLocalStorage,
    chats: fromLocalStorage.chats.map(
      (ray) => ({ ray, messages: [], new: 0, messagesIds: {} })
    ),
  }

  return result
}

class Actions {
  static TYPES = {
    MERGE: 'merge',
    JOIN: 'join',
    REMOVE: 'remove',
    ACTIVE: 'active',
    MESSAGES: 'messages'
  }

  constructor (node, dispatch) {
    this.node = node
    this.dispatch = dispatch
  }

  merge (payload) {
    this.dispatch({ type: Actions.TYPES.MERGE, payload })
  }

  messages (chat, messages, position = 'start') {
    this.dispatch({ type: Actions.TYPES.MESSAGES, payload: { chat, messages, position } })
  }

  isBusy (chat, value) {
    this.dispatch({ type: Actions.TYPES.BUSY, payload: { chat, value } })
  }

  async more (chatRay, offset) {
    const node = this.node.current
    if (node == null) {
      return
    }

    this.isBusy(chatRay, true)
    const messages = await node.contracts.lambda(
      node.key, 
      node.config.contract, 
      'messages', 
      { chat: chatRay, offset, limit:10 }
    )

    this.messages(chatRay, messages.reverse().map((message) => ({
      ...message,
      my: message.author === node.key
    })))
    this.isBusy(chatRay, messages.length === 0 ? 'no-more' : false)
  }

  async send (chat, message) {
    const node = this.node.current
    await node.contracts.lambda(
      node.key, 
      node.config.contract, 
      'message', 
      { chat, message }
    )
  }

  active (chat) {
    this.dispatch({ type: Actions.TYPES.ACTIVE, payload: { chat } })
  }

  async join (chat) {
    const node = this.node.current

    this.dispatch({ type: Actions.TYPES.JOIN, payload: { chat } })
    await node.rays.subscribe(
      node.key, 
      { contract: node.config.contract, ray: `CHATS#${chat}` }, 
      (_, __, messageStr) => {
        try {
          const message = JSON.parse(messageStr)
          message.my = message.author === node.key

          this.messages(chat, [ message ], 'end')
        } catch (e) {
          console.error(e)
        }
      }
    )
  }

  remove (chat) {
    this.dispatch({ type: Actions.TYPES.REMOVE, payload: { chat } })
  }
}

export default useChats