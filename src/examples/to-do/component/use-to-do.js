import Node from '@inshel/node'
import FLocalStorage from 'fallback-local-storage'
import React from 'react'
import uuid from 'uuid'

const ls = new FLocalStorage()

const reducerBase = (state, action) => {
  switch (action.type) {
    case 'START':
      return { 
        ...state,
        nodeStatus: 'connected',
        privateKey: action.payload.privateKey
      }
    
    case 'SET-STATUS':
      return { 
        ...state, 
        status: action.payload.status,
        tasks: [],
        inProgress: action.payload.inProgress,
        isLoaded: false
      }

    case 'IN-PROGRESS':
      return { 
        ...state, 
        inProgress: action.payload
      }
    
    case 'TASKS':
      if (state.inProgress !== action.payload.inProgress) {
        return { ...state }
      }

      return { 
        ...state, 
        tasks: state.tasks.concat(action.payload.tasks),
        inProgress: null,
        isLoaded: action.payload.tasks.length < 25
      }

    case 'TASK':
      const task = action.payload.document == null
        ? null
        : state.tasks.find(({ document }) => document === action.payload.document)

      return { 
        ...state, 
        tasks: task == null 
          ? (
              action.payload.status === state.status || action.payload.force 
                ? [ action.payload ] 
                : []
            ).concat(state.tasks)
          : state.tasks.map((currentTask) => (currentTask.document === action.payload.document
            ? { ...currentTask, ...action.payload }
            : currentTask
          ))
      }

    default:
      throw new Error(`Unhandled action type "${action.type}"`)
  }
}

const reducer = (...args) => {
  const newState = reducerBase(...args)
  ls.setItem(
    'tasks', 
    JSON.stringify({ 
      privateKey: newState.privateKey
    })
  )

  return newState
}

const defaultValue = () => {
  const fromLocalStorage = JSON.parse(ls.getItem('tasks') || JSON.stringify({ }))

  return {
    nodeStatus: 'disconnected',
    status: 'UNDONE',
    tasks: [],
    inProgress: null,
    isLoaded: false,
    ...fromLocalStorage
  }
}

export class Actions {
  constructor (dispatch, node) {
    this.dispatch = dispatch
    this.node = node
  }

  start (privateKey) {
    this.dispatch({ type: 'START', payload: { privateKey } })
  }

  async more ({ inProgress, status, offset }) {
    const tasks = await this.node.current.contracts.lambda(
      this.node.current.key, 
      this.node.current.config.contract, 
      'tasks', 
      { status, offset, limit: 25 }
    )

    this.dispatch({ 
      type: 'TASKS', 
      payload: { 
        inProgress, 
        tasks: tasks.map((task) => ({ ...task, status }))
      } 
    })
  }

  async changeStatus (document, status) {
    await this.node.current.contracts.lambda(
      this.node.current.key, 
      this.node.current.config.contract, 
      'task.changeStatus', 
      { id: document, status }
    )
  }

  upsert (token, title, status) {
    return this.node.current.contracts.lambda(
      this.node.current.key, 
      this.node.current.config.contract, 
      'task', 
      { token, title, status }
    )
  }

  async onNewTask (title) {
    const token = uuid.v4()
    const { document } = await this.upsert(token, title, 'UNDONE')

    this.dispatch({ 
      type: 'TASK', 
      payload: { force: true, document, token, title, status: 'UNDONE' } 
    })
  }

  onTask (task) {
    this.dispatch({ type: 'TASK', payload: task })
  }

  onUpdate (token, title, status) {
    this.dispatch({ 
      type: 'TASK', 
      payload: { token, title } 
    })

    return this.upsert(token, title, status)
  }

  onSetStatus (status) {
    const inProgress = uuid.v4()

    this.dispatch({ type: 'SET-STATUS', payload: { inProgress, status } })
    return this.more({ inProgress, status, offset: 0 })
  }

  onMore (status, offset) {
    const inProgress = uuid.v4()

    this.dispatch({ type: 'IN-PROGRESS', payload: inProgress })
    return this.more({ inProgress, status, offset })
  }

  onDone (document) {
    this.dispatch({ type: 'TASK', payload: { document, status: 'DONE' } })
    return this.changeStatus(document, 'DONE')
  }

  onUndone (document) {
    this.dispatch({ type: 'TASK', payload: { document, status: 'UNDONE' } })
    return this.changeStatus(document, 'UNDONE')
  }
}

export default (config) => {
  const [ state, dispatch ] = React.useReducer(reducer, defaultValue())
  const nodeRef = React.useRef(null)
  const actions = new Actions(dispatch, nodeRef)
  
  React.useEffect(() => {
    const effect = async () => {
      let { privateKey } = state
      const node = new Node()
      
      node.config = config
      nodeRef.current = node
      
      // Connect
      await node.connect()

      // Sign up
      if (privateKey == null) {
        const newKey = new JSEncrypt()
        privateKey = newKey.getPrivateKey()

        await node.contractKeys.signUp(config.contract, newKey.getPublicKey(), {})
      }

      // Sign in
      const encryptKey = new JSEncrypt()
      encryptKey.setPrivateKey(privateKey)

      const { key } = await node.keys.approve(encryptKey)
      node.key = key

      actions.start(privateKey)

      // Subscribe to ray
      node.rays.subscribe(
        key, 
        { contract: config.contract, ray: `TASKS#${key}` }, 
        (_, __, messageStr) => {
          try {
            const task = JSON.parse(messageStr)
            actions.onTask(task)
          } catch (e) {
            console.error(e)
          }
        }
      )
    }

    effect().catch((e) => { 
      console.error(e)
    })
  }, [])

  return [ state, actions ]
}