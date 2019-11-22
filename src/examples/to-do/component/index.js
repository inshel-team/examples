import { makeStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox'
import CircularProgress from '@material-ui/core/CircularProgress'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import TextField from '@material-ui/core/TextField'
import React from 'react'

import useToDo from './use-to-do'

const ToDo = ({ config }) => {
  const classes = useStyles()
  const [ state, actions ] = useToDo(config)
  const [ title, setTitle ] = React.useState('')
  const tasksRef = React.useRef()
  
  const { nodeStatus, status, tasks, inProgress, isLoaded } = state

  const onKeyDown = React.useCallback(
    ({ keyCode }) => {
      if (keyCode !== 13) {
        return
      }

      setTitle('')
      actions.onNewTask(title)
    },
    [ title ]
  )

  React.useEffect(
    () => {
      const interval = setInterval(
        () => {
          if (nodeStatus !== 'connected' 
            || inProgress != null 
            || isLoaded
            || tasksRef.current == null
          ) {
            return
          }

          const delta = tasksRef.current.scrollHeight - tasksRef.current.scrollTop - tasksRef.current.offsetHeight
          if (delta > 32) {
            return
          }

          actions.onMore(status, tasks.length)
        }, 
        500
      )

      return () => {
        clearInterval(interval)
      }
    }, 
    [ nodeStatus, status, tasks, inProgress, isLoaded ]
  )

  return (
    <div className={classes.root}>
      <TextField 
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        fullWidth
      />
      <Tabs value={status} onChange={(_, value) => actions.onSetStatus(value)}>
        <Tab label="UNDONE" value="UNDONE" />
        <Tab label="DONE" value="DONE" />
      </Tabs>
      <List className={classes.list} ref={tasksRef}>
        {tasks.map(({ document, title, status: taskStatus }) => (
          <ListItem 
            key={document} 
            role={undefined} 
            dense 
            button 
            onClick={() => actions[taskStatus === 'DONE' ? 'onUndone' : 'onDone'](document)}
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={taskStatus === 'DONE'}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText primary={title} />
          </ListItem>
        ))}
        {inProgress == null ? null : (
          <ListItem 
            role={undefined} 
            dense 
            button 
          >
            <ListItemText 
              primary={<CircularProgress />} 
            />
          </ListItem>
        )}
      </List>
    </div>
  )
}

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  list: {
    flex: 1,
    overflow: 'auto',
    margin: '16px 0'
  }
}))

export default ToDo