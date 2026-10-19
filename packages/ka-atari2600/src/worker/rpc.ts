// Adapted from 6502.ts worker/src/rpc.ts (MIT, Copyright (c) 2014 -- 2020 Christian Speckner and contributors).
import { RpcProvider, type RpcProviderInterface } from 'worker-rpc'

let port: MessagePort | null = null
let portPending: MessagePort | null = null

function send(message: unknown, transfer?: Transferable[]): void {
  if (port) {
    port.postMessage(message, transfer ?? [])
  } else {
    postMessage(message, { transfer: transfer ?? [] })
  }

  if (portPending) {
    port = portPending
    port.onmessage = (e: MessageEvent) => rpcProvider.dispatch(e.data)
  }

  portPending = null
}

const rpcProvider: RpcProvider = new RpcProvider(send)
rpcProvider.error.addHandler((e) => {
  console.log(e ? e.message : 'unknown rpc error')
})
onmessage = (e: MessageEvent) => (port ? undefined : rpcProvider.dispatch(e.data))

rpcProvider.registerRpcHandler('/use-port', (newPort: MessagePort) => {
  if (!(port || portPending)) {
    portPending = newPort
    return Promise.resolve()
  }
  return Promise.reject('RPC already switched to message port')
})

export function getRpc(): RpcProviderInterface {
  return rpcProvider
}
