import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import React from 'react'

import Chat from './chat'
import ChatsList from './chats-list'
import NewChat from './new-chat'
import useChats from './use-chats'

const ExampleChat = ({ config }) => {
  const classes = useStyles()
  const { 
    state: { status, chats, activeChat }, 
    actions 
  } = useChats(config)
  const active = chats.find(({ ray }) => ray === activeChat)

  if (status !== 'connected') {
    return (
      <div className={classes.root}>
        <CircularProgress className={classes.progress} />
      </div>
    )
  }

  return (
    <div className={classes.root}>
      <ChatsList 
        className={classes.chatsList} 
        chats={chats}
        active={active}
        onActive={(chat) => actions.active(chat)}
        onRemove={(chat) => actions.remove(chat)}
      />
      {active == null 
        ? <NewChat onJoin={(chat) => actions.join(chat)} /> 
        : <Chat
            key={active.ray} 
            chat={active} 
            onMore={(chat, offset) => actions.more(chat, offset) } 
            onSend={(chat, message) => actions.send(chat, message)} 
          />
      }
    </div>
  )
}

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'row'
  },
  progress: {
    margin: 'auto auto auto auto'
  },
  chatsList: {
    width: 280,
    minWidth: 280,
  },
  content: {
    flex: 1
  }
}))

export default ExampleChat