import ReactDOM from 'react-dom'
import React from 'react'

import Application from "./application";
import "./index.css";

const applicationElement = document.createElement('div')
applicationElement.setAttribute('style', 'width:100vw;height:100vh;overflow:hidden')
document.body.appendChild(applicationElement)

const render = () => {
  ReactDOM.render(<Application />, applicationElement)
}

if (typeof module.hot === 'function') {
  module.hot.accept('./application.js', Application)
}

render()