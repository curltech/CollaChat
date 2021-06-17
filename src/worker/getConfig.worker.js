import axios from 'axios'

self.onmessage = async function (event) {
  console.log('getConfig worker receive message:' + event.data)
  let start = new Date().getTime()
  let configName = event.data
  let response = null
  try {
    let _client = axios.create()
    if (_client) {
      let serviceData = await _client.get("https://curltech.io/conf/" + configName + ".conf?time=" + new Date().getTime())
      if (serviceData) {
        response = serviceData.data
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    let end = new Date().getTime()
    console.log('getConfig-' + configName + ' time:' + (end - start))
    self.postMessage(response)
  }
}
