import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconChat from '@material-ui/icons/Chat'
import IconDelete from '@material-ui/icons/Delete'
import classnames from 'classnames'
import React from 'react'
import { ChatList } from 'react-chat-elements'

const ChatsList = ({ chats, active, className, onActive, onRemove }) => {
  const classes = useStyles()

  if (chats.length === 0) {
    return null
  }

  return (
    <div 
      className={classnames({  
        [classes.root]: true,
        [className]: typeof className === 'string'
      })}
    >
      {chats.length > 19 
        ? null
        : (
          <Button 
            className={classes.newChat}
            color="primary"
            variant="contained"
            disabled={active == null}
            onClick={() => onActive(null)}
          >
            NEW CHAT
          </Button>
        )}
      <ChatList 
        className={classes.list}
        dataSource={chats.map(({ ray, messages, new: newMessages }) => ({
          title: ray,
          className: active != null && active.ray === ray ? classes.active : null,
          dateString: ' ',
          subtitle: messages.length === 0 
            ? '' 
            : messages[messages.length - 1].message,
          unread: newMessages
        }))}
        onClick={({ title }) => onActive(title)}
      />
    </div>
  )
}

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    overflow: 'auto'
  },
  newChat: {
    width: 'calc(100% - 32px)',
    margin: 16
  },
  list: {
  },
  active: {
    '& > div': {
      backgroundColor: `${theme.palette.grey[200]} !important`
    }
  }
}))

export default ChatsList