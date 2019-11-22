import fs from 'fs'
import path from 'path'

import '@babel/polyfill'
import Node from '@inshel/node'
import JSEncrypt from 'node-jsencrypt'

import chatContract from './examples/chat/contract'
import toDoContract from './examples/to-do/contract'

import config from '../environment/config.json'

const { contract } = config
const contracts = [ chatContract, toDoContract ]

const mainKey = new JSEncrypt()
mainKey.setPrivateKey(
  fs.readFileSync(
    path.join(process.cwd(), 'environment', 'key'), 
    { encoding: 'utf-8' }
  )
)

const start = async () => {
  const node = new Node()
  await node.connect()
  const { key: mainKeyId } = await node.keys.approve(mainKey)
  await node.contracts.subscribe(
    contract, 
    async (...args) => {
      for (let i = 0; i < contracts.length; i++) {
        const current = contracts[i]
        const result = await current({ node, key: mainKeyId, contract }, ...args) 
        
        if (result != null) {
          return result
        }
      }
    }
  )
}

start()
  .then(() => {
    console.log('Examples node started')
  })
  .catch((e) => {
    console.error(e)
  })