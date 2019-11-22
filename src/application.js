import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconMenu from '@material-ui/icons/Menu';
import FLocalStorage from 'fallback-local-storage'
import React from 'react'

import config from '../environment/config.json'
import examples from './examples'

export default () => {
  const classes = useStyles()
  const [ state, dispatch ] = React.useReducer(reducer, defaultState())
  const actions = new Actions(dispatch)
  
  const { title, Component } = examples[state.example] || examples.about
  const menuClose = React.useCallback(
    () => {
      if (!state.menuVisible) {
        return
      }

      actions.toggleMenu()
    }, 
    [ state.menuVisible ]
  )

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="menu"
            className={classes.appBarButton} 
            onClick={() => actions.toggleMenu()}
          >
            <IconMenu />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            IS Network examples: {title}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer open={state.menuVisible} onClose={menuClose}>
        <List>
          {Object.keys(examples)
            .map((key) => (
              <ListItem 
                key={key} 
                button 
                className={classes.menuItem}
                onClick={() => actions.setExample(key)}
              >
                <ListItemIcon>
                  {examples[key].icon}
                </ListItemIcon>
                <ListItemText primary={examples[key].title} />
              </ListItem>
            ))}
        </List>
      </Drawer>
      <div className={classes.component}>
        <Component config={config} />
      </div>
    </>
  )
}

const useStyles = makeStyles((theme) => ({
  appBarButton: {
    marginRight: theme.spacing(2),
  },
  menuItem: {
    minWidth: 200
  },
  component: {
    margin: '16px 8px',
    width: 'calc(100% - 32px)',
    height: 'calc(100% - 64px)',
    overflow: 'hidden'
  }
}))

const reducerBase = (state, action) => {
  switch (action.type) {
    case Actions.TYPES.SET_EXAMPLE:
      return { 
        ...state, 
        example: action.payload,
        menuVisible: false
      }
    
    case Actions.TYPES.TOGGLE_MENU:
      return { 
        ...state,
        menuVisible: !state.menuVisible
      }

    default:
      throw new Error(`Unhandled action.type\naction=${JSON.stringify(action)}`)
  }
}

const reducer = (...args) => {
  const ls = new FLocalStorage()

  const newState = reducerBase(...args)
  ls.setItem('state', JSON.stringify(newState))

  return newState
}

const defaultState = () => {
  const ls = new FLocalStorage()
  try {
    const result = JSON.parse(ls.getItem('state'))
    
    return result != null ? result : defaultState.start
  } catch (e) {
    return defaultState.start
  }
}

defaultState.start = { example: 'about', menuVisible: false }

class Actions {
  static TYPES = {
    SET_EXAMPLE: 'set-example',
    SET_EXAMPLE_STATE: 'set-example-state',
    TOGGLE_MENU: 'toggle-menu'
  }

  constructor (dispatch) {
    this.dispatch = dispatch
  }

  setExample (payload) {
    this.dispatch({ type: Actions.TYPES.SET_EXAMPLE, payload })
  }

  setExampleState (state) {
    this.dispatch({ type: Actions.TYPES.SET_EXAMPLE_STATE, payload: { state } })
  }

  toggleMenu () {
    this.dispatch({ type: Actions.TYPES.TOGGLE_MENU })
  }
}
