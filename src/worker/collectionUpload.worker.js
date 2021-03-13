import { myself } from 'libcolla'
import { openpgp } from 'libcolla'

self.onmessage = async function (event) {
  console.log('collectionUpload worker receive message:' + JSON.stringify(event.data))
  let start = new Date().getTime()
  let flag = event.data[0]
  let dbLogs = event.data[1]
  myself.myselfPeerClient = event.data[2]
  let options = {}
  options.privateKey = event.data[3]
  openpgp.parseClonedPackets(options)
  myself.privateKey = options.privateKey
  let responses = null
  try {
    if (dbLogs && dbLogs.length > 0) {
      let ps = []
      for (let dbLog of dbLogs) {
        let promise = consensusAction.consensus(null, null, dbLog.dataBlock)
        ps.push(promise)
      }
      responses = await Promise.all(ps)
    }
  } catch (err) {
    console.error(err)
  } finally {
    let end = new Date().getTime()
    console.log('collectionUpload time:' + (end - start))
    self.postMessage([flag, responses, dbLogs])
  }
}