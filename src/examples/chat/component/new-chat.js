import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import React from 'react'

const NewChat = ({ onJoin: onJoinProps }) => {
  const classes = useStyles()
  const [ chat, setChat ] = React.useState('')
  const onJoin = React.useCallback(() => { onJoinProps(chat) }, [ chat ])
  const onKeyPress = (e) => {
    if (e.key !== 'Enter') {
      return
    }

    onJoin()
  }

  return (
    <div className={classes.root}>
      <TextField 
        label="Chat"
        value={chat}
        onChange={(e) => setChat(e.target.value)}
        className={classes.input}
        onKeyPress={onKeyPress}
        autoFocus
        fullWidth
      />
      <div className={classes.actions}>
        <Button 
          color="primary"
          variant="contained"
          onClick={onJoin}
          disabled={chat.length === 0}
        >
          JOIN
        </Button>
      </div>
    </div>
  )
}

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    margin: '16px 32px'
  },
  input: {
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    margin: '16px 0',
  }
}))

export default NewChat
