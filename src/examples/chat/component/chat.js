import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import IconSend from '@material-ui/icons/Send';
import React from 'react'
import 'react-chat-elements/dist/main.css'
import { Input, MessageList } from 'react-chat-elements'

const Chat = ({ chat, onMore, onSend: onSendProps }) => {
  const classes = useStyles()
  const input = React.useRef()
  const [ messagesScroll, setMessagesScroll ] = React.useState(1)
  
  const onSend = React.useCallback(
    () => {
      if (input.current == null || input.current.input.value === '') {
        return
      }
  
      onSendProps(chat.ray, input.current.state.value)
      input.current.setState({ value: '' })
    },
    [ ]
  )
  const onKeyDown = React.useCallback(
    (e) => {
      if (!e.ctrlKey || e.keyCode !== 13) {
        return
      }

      onSend()
    },
    [ ]
  )
  const onScroll = React.useCallback(
    (e) => {
      setMessagesScroll(Math.max(
        1,
        e.target.scrollHeight - e.target.scrollTop - e.target.offsetHeight        
      ))
      if (e.target.scrollTop > 0 || chat.isBusy) {
        return
      }

      onMore(chat.ray, chat.messages.length) 
    }, 
    [ chat.isBusy, chat.messages.length ]
  )

  React.useEffect(() => { 
    onMore(chat.ray, chat.messages.length) 
  }, [ ])

  return (
    <div className={classes.root}>
      <div className={classes.messages}>
        <MessageList 
          onScroll={onScroll}
          toBottomHeight={messagesScroll}
          dataSource={chat.messages.map(({ author, message, my, token }) => ({
            position: my ? 'right' : 'left',
            type: 'text',
            text: typeof message === 'string' ? message : JSON.stringify(message),
            dateString: author
          }))}
        />
      </div>
      <div className={classes.editor}>
        <Input 
          ref={input}
          placeholder="Message"
          multiline={true}
          rightButtons={
            <IconButton 
              color="primary"
              onClick={onSend}
            >
              <IconSend />
            </IconButton>
          }
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  messages: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    '& > div': {
      width: '100%'
    },
    '& .rce-mbox-text': {
      margin: 16
    },
    '& .rce-mbox-time': {
      top: '100%'
    }
  },
  editor: {
    position: 'relative',
    margin: 8
  },
  send: {
    position: 'absolute',
    right: 0,
    bottom: 8
  }
}))

export default Chat