import { myself, DataBlockService, dataBlockService } from 'libcolla'
import { openpgp } from 'libcolla'

self.onmessage = async function (event) {
  console.log('collectionDownload worker receive message:' + JSON.stringify(event.data))
  let start = new Date().getTime()
  let downloadList = event.data[0]
  myself.myselfPeerClient = event.data[1]
  let options = {}
  options.privateKey = event.data[2]
  openpgp.parseClonedPackets(options)
  myself.privateKey = options.privateKey
  let responses = null
  try {
    if (downloadList && downloadList.length > 0) {
      let ps = []
      for (let download of downloadList) {
        let blockId = download['blockId']
        let primaryPeerId = download['primaryPeerId']
        // use null instead of primaryPeerId to avoid single point of failure
				let promise = dataBlockService.findTxPayload(null, blockId)
        ps.push(promise)
      }
      responses = await Promise.all(ps)
    }
  } catch (err) {
    console.error(err)
  } finally {
    let end = new Date().getTime()
    console.log('collectionDownload time:' + (end - start))
    self.postMessage(responses)
  }
}