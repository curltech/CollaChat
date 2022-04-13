class FileComponent {
    constructor() {
    }
    /**
     * LocalFileSystem.PERSISTENT window.TEMPORARY
     * @param {*} fileSystemType
     */
    getRootDirEntry(fileSystemType) {
        if (fileSystemType === 'tmp') {
            fileSystemType = window.TEMPORARY
        } else {
            fileSystemType = LocalFileSystem.PERSISTENT
        }
        return new Promise(function (resolve, reject) {
            window.requestFileSystem(fileSystemType, 0, function (fs) {
                console.log('file system open: ' + fs.name)
                resolve(fs.root)
            }, function onErrorLoadFs() {
                reject()
            })
        })
    }
    getDirEntry(dirPath) {
        return new Promise(function (resolve, reject) {
            window.resolveLocalFileSystemURL(dirPath, function onSuccess(dirEntry) {
                resolve(dirEntry)
            }, function onError() {
                reject()
            })
        })
    }
    /**
     * 从文件的路径获取文件对象
     *
     * @param {*} fileUri
     */
    getFileEntry(fileUri) {
        return new Promise(function (resolve, reject) {
            window.resolveLocalFileSystemURL(fileUri, function success(fileEntry) {
                // Do something with the FileEntry object, like write to it, upload it, etc.
                console.log('got file fullPath: ' + fileEntry.fullPath + ', toURL: ' + fileEntry.toURL())
                resolve(fileEntry)
            }, function () {
                // If don't get the FileEntry (which may happen when testing
                // on some emulators), copy to a new FileEntry.
                reject()
            })
        })
    }
    createDirectory(rootDirEntry, dirName) {
        return new Promise(function (resolve, reject) {
            rootDirEntry.getDirectory(dirName, { create: true }, function (dirEntry) {
                resolve(dirEntry)
            }, function onErrorGetDir() {
                reject()
            })
        })
    }
    createFile(fileName, options = { size: 0, create: true, exclusive: false }) {
        return new Promise(function (resolve, reject) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, options.size, function (fs) {
                console.log('file system open: ' + fs.name)
                fs.root.getFile(fileName, { create: options.create, exclusive: options.exclusive },
                    function (fileEntry) {
                        console.log('fileEntry is file?' + fileEntry.isFile.toString())
                        resolve(fileEntry)
                    }, function onErrorCreateFile() {
                        reject()
                    })
            }, function onErrorLoadFs() {
                reject()
            })
        })
    }
    createTemporaryFile(fileName, options = { size: 5 * 1024 * 1024, create: true, exclusive: false }) {
        return new Promise(function (resolve, reject) {
            window.requestFileSystem(window.TEMPORARY, options.size, function (fs) {
                console.log('file system open: ' + fs.name)
                fs.root.getFile(fileName, { create: options.create, exclusive: options.exclusive },
                    function (fileEntry) {
                        console.log('fileEntry is file?' + fileEntry.isFile.toString())
                        resolve(fileEntry)
                    }, function onErrorCreateFile() {
                        reject()
                    })
            }, function onErrorLoadFs() {
                reject()
            })
        })
    }
    /**
     * 在指定目录（默认cordova.file.cacheDirectory）中创建新的文件对象，然后文件对象可以用于写文件，上传等
     *
     * @param {*} fileName
     * @param {*} dirPath
     */
    createNewFileEntry(fileName, dirPath) {
        if (!dirPath) {
            dirPath = cordova.file.cacheDirectory
        }
        return new Promise(function (resolve, reject) {
            window.resolveLocalFileSystemURL(dirPath, function success(dirEntry) {
                dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
                    // Do something with it, like write to it, upload it, etc.
                    console.log('got file fullPath: ' + fileEntry.fullPath + ', toURL: ' + fileEntry.toURL())
                    resolve(fileEntry)
                }, function onErrorCreateFile() {
                    // If don't get the FileEntry (which may happen when testing
                    // on some emulators), copy to a new FileEntry.
                    reject()
                })
            }, function onErrorCreateFile() {
                // If don't get the FileEntry (which may happen when testing
                // on some emulators), copy to a new FileEntry.
                reject()
            })
        })
    }
    writeFile(fileEntry, dataObj/** Blob */, isAppend) {
        return new Promise(function (resolve, reject) {
            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function () {
                    console.log('Successful file write...')
                    resolve(fileEntry)
                }

                fileWriter.onerror = function (e) {
                    console.log('Failed file write: ' + e.toString())
                    reject(e)
                }

                // If data object is not passed in,
                // create a new Blob instead.
                if (!dataObj) {
                    reject()
                }
                if (isAppend) {
                    try {
                        fileWriter.seek(fileWriter.length)
                    } catch (e) {
                        console.log("file doesn't exist!")
                        reject(e)
                    }
                }
                fileWriter.write(dataObj)
            })
        })
    }
    readFile(fileEntry, options = { format: 'blob', type: 'image/jpeg' }) {
        return new Promise(function (resolve, reject) {
            fileEntry.file(function (file) {
                let reader = new FileReader()
                reader.onloadend = function (e) {
                    if (options.format === 'txt') {
                        console.log('Successful file read: ' + this.result.length)
                        resolve(this.result)
                    } else {
                        console.log('Successful file read: ' + this.result.byteLength)
                        let arr = new Uint8Array(this.result)
                        if (options.format === 'blob' && options.type) {
                            let blob = new Blob([arr], { type: options.type })
                            resolve(blob)
                        } else {
                            resolve(arr)
                        }
                    }
                }
                if (options.format === 'txt') {
                    reader.readAsText(file)
                } else {
                    reader.readAsArrayBuffer(file)
                }
            }, function onErrorReadFile() {
                reject()
            })
        })
    }
    async createAndWriteFile(fileName, dataObj) {
        let fileEntry = await fileComponent.createTemporaryFile(fileName)
        await fileComponent.writeFile(fileEntry, dataObj)

        return fileEntry
    }
}
export let fileComponent = new FileComponent()

class VibrationComponent {
    constructor() {
    }
    startVibration(time = 1000) {
        navigator.vibrate(time)
    }
    stop() {
        navigator.vibrate(0)
    }
}
export let vibrationComponent = new VibrationComponent()

class StatusBarComponent {
    constructor() {
    }
    show(ifOverlays) {
        //StatusBar.overlaysWebView(true)
        //StatusBar.backgroundColorByHexString('#33000000')
        //StatusBar.styleLightContent()
        StatusBar.show()
        if (ifOverlays) {
            if (window.device && window.device.platform === 'Android') { // 当前版本Android需先置false再置true生效
                StatusBar.overlaysWebView(false)
                StatusBar.overlaysWebView(true)
            } else {
                StatusBar.overlaysWebView(true)
            }
        } else {
            StatusBar.overlaysWebView(false)
        }
    }
    hide() {
        StatusBar.hide()
    }
    style(isDefault, colorHexString) {
        // 针对iPad状态栏styleDefault无效的补丁
        if (deviceComponent.getDeviceProperty('model') && deviceComponent.getDeviceProperty('model').substring(0, 4) === 'iPad' && (isDefault || colorHexString !== '#33000000')) {
            return
        }
        if (isDefault) {
            StatusBar.styleDefault()
        } else {
            StatusBar.styleLightContent()
        }
        if (colorHexString) {
            StatusBar.backgroundColorByHexString(colorHexString)
        }
    }
    /*handleAndroidStatusBarHeight() { // 需修改cordova-plugin-statusbar源码
      StatusBar.getStatusBarHeight((height) => {
        console.log('height:' + height)
        if (parseInt(height) > 0) {
            const code = `:root{--safe-area-inset-top:${parseInt(height)}px;--safe-area-inset-right:0px;--safe-area-inset-bottom:0px;--safe-area-inset-left:0px;` +
                `@supports(top:constant(safe-area-inset-top)){--safe-area-inset-top:constant(safe-area-inset-top);--safe-area-inset-right:constant(safe-area-inset-right);` +
                `--safe-area-inset-bottom:constant(safe-area-inset-bottom);--safe-area-inset-left:constant(safe-area-inset-left)}` +
                `@supports(top:env(safe-area-inset-top)){--safe-area-inset-top:env(safe-area-inset-top);--safe-area-inset-right:env(safe-area-inset-right);` +
                `--safe-area-inset-bottom:env(safe-area-inset-bottom);--safe-area-inset-left:env(safe-area-inset-left)}}`
            console.log('code:' + code)
            const style = document.createElement('style')
            style.type = 'text/css'
            style.rel = 'stylesheet'
            style.appendChild(document.createTextNode(code))
            const head = document.getElementsByTagName('head')[0]
            head.appendChild(style)
        }
      })
    }*/
}
export let statusBarComponent = new StatusBarComponent()

class GeolocationComponent {
    constructor() {
    }
    onError(error) {
        alert('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n')
    }
    getCurrentPosition(fun) {
        navigator.geolocation.getCurrentPosition(function (positon) {
            console.log(
                'Latitude: ' + position.coords.latitude + '\n' +
                'Longitude: ' + position.coords.longitude + '\n' +
                'Altitude: ' + position.coords.altitude + '\n' +
                'Accuracy: ' + position.coords.accuracy + '\n' +
                'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
                'Heading: ' + position.coords.heading + '\n' +
                'Speed: ' + position.coords.speed + '\n' +
                'Timestamp: ' + position.timestamp + '\n')
            fun(positon)
        }, this.onError)
    }
}
export let geolocationComponent = new GeolocationComponent()

class BatteryStatusComponent {
    constructor() {
    }
    registBatteryStatus(func) {
        window.addEventListener('batterystatus', func, false)
    }
    registBatteryLow(func) {
        window.addEventListener('batterylow', func, false)
    }
    registBatteryCritical(func) {
        window.addEventListener('batterycritical', func, false)
    }
}
export let batteryStatusComponent = new BatteryStatusComponent()

class DeviceComponent {
    constructor() {
    }
    getDeviceProperty(name) {
        return eval('device.' + name)
    }
    lockScreen(type) {
        screen.orientation.lock(type)
    }
    unlockScreen(type) {
        screen.orientation.unlock()
    }
    currentScreen() {
        return screen.orientation.type
    }
    registScreenChange(func) {
        screen.orientation.onchange = func
    }
    registWindowChange(func) {
        window.addEventListener('orientationchange', func)
    }
    getOnlineStatus() {
      return navigator.onLine
    }
    getNetworkState() {
        let networkState = navigator.connection.type
        let states = {}
        states[Connection.UNKNOWN] = 'Unknown connection'
        states[Connection.ETHERNET] = 'Ethernet connection'
        states[Connection.WIFI] = 'WiFi connection'
        states[Connection.CELL_2G] = 'Cell 2G connection'
        states[Connection.CELL_3G] = 'Cell 3G connection'
        states[Connection.CELL_4G] = 'Cell 4G connection'
        states[Connection.CELL] = 'Cell generic connection'
        states[Connection.NONE] = 'No network connection'

        return states[networkState]
    }
    registOnline(func) {
        //document.addEventListener(online', func, false)
        if (document.body.addEventListener) {
          window.addEventListener("online", func, true)
        } else if (document.body.attachEvent) {
          window.attachEvent("ononline", func)
        } else {
          window.ononline = func
        }
    }
    registOffline(func) {
        //document.addEventListener('offline', func, false)
        if (document.body.addEventListener) {
          window.addEventListener("offline", func, true)
        } else if (document.body.attachEvent) {
          window.attachEvent("onoffline", func)
        } else {
          window.onoffline = func
        }
    }
    getCurrentPosition(options = { enableHighAccuracy: true }) {
        return new Promise(function (resolve, reject) {
            // onSuccess Callback
            // This method accepts a Position object, which contains the
            // current GPS coordinates
            navigator.geolocation.getCurrentPosition(function onSuccess(position) {
                alert('Latitude: ' + position.coords.latitude + '\n' +
                    'Longitude: ' + position.coords.longitude + '\n' +
                    'Altitude: ' + position.coords.altitude + '\n' +
                    'Accuracy: ' + position.coords.accuracy + '\n' +
                    'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
                    'Heading: ' + position.coords.heading + '\n' +
                    'Speed: ' + position.coords.speed + '\n' +
                    'Timestamp: ' + position.timestamp + '\n')
                resolve(position)
            }, function onError(error) {
                alert('code: ' + error.code + '\n' +
                    'message: ' + error.message + '\n')
                reject()
            }, options)
        })
    }
    /**
     * function onSuccess(position)
     * @param {*} onSuccess
     * @param {*} onError
     * @param {*} options { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }
     */
    watchPosition(onSuccess, onError, options = { timeout: 30000 }) {
        let watchID = navigator.geolocation.watchPosition(onSuccess, onError, options)

        return watchID
    }
    clearWatch(watchID) {
        navigator.geolocation.clearWatch(watchID)
    }
    vibrate(pattern) {
        navigator.vibrate(pattern)
    }
    /**
     * location: 1 // To get information about external storage (For android only)
        location: 2 // To get information about internal storage (For android only)
     * @param {*} options
     */
    async getDiskInfo(options) {
        if (DiskSpacePlugin) {
          return new Promise(function (resolve, reject) {
              DiskSpacePlugin.info(options, function successCallback(result) {
                  resolve(result)
              }, function errorCallback(err) {
                  reject(err)
              })
          })
        } else {
          return null
        }
    }
    async getStorageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            let quota = await navigator.storage.estimate()
            // quota.usage -> Number of bytes used.
            // quota.quota -> Maximum number of bytes available.
            if (quota && quota.quota) {
              let percentageUsed = (quota.usage / quota.quota) * 100
              console.log(`You've used ${percentageUsed}% of the available storage.`)
              let remaining = quota.quota - quota.usage
              console.log(`You can write up to ${remaining} more bytes.`)
              return {
                quota: quota.quota,
                usage: quota.usage,
                percentageUsed: percentageUsed,
                remaining: remaining
              }
            }
        }

        return null
    }
    async getTemporaryStorageInfo() {
      if (navigator.webkitTemporaryStorage && navigator.webkitTemporaryStorage.queryUsageAndQuota) {
        return new Promise(function (resolve, reject) {
          navigator.webkitTemporaryStorage.queryUsageAndQuota(function(usedBytes, grantedBytes) {
            if (usedBytes) {
              usedBytes = usedBytes/1024/1024
            }
            if (grantedBytes) {
              grantedBytes = grantedBytes/1024/1024
            }
            console.log('webkitTemporaryStorage: we are using ', usedBytes, ' of ', grantedBytes, 'MB')
            resolve({
              usedBytes: usedBytes,
              grantedBytes: grantedBytes
            }) 
          },
          function(e) {
            console.log('Error', e)
            reject({
              error: e
            })
          })
        })
      } else {
        return null
      }
    }
    async getPersistentStorageInfo() {
      if (navigator.webkitPersistentStorage && navigator.webkitPersistentStorage.queryUsageAndQuota) {
        return new Promise(function (resolve, reject) {
          navigator.webkitPersistentStorage.queryUsageAndQuota(function(usedBytes, grantedBytes) {
            if (usedBytes) {
              usedBytes = usedBytes/1024/1024
            }
            if (grantedBytes) {
              grantedBytes = grantedBytes/1024/1024
            }
            console.log('webkitPersistentStorage: we are using ', usedBytes, ' of ', grantedBytes, 'MB')
            resolve({
              usedBytes: usedBytes,
              grantedBytes: grantedBytes
            }) 
          },
          function(e) {
            console.log('Error', e)
            reject({
              error: e
            })
          })
        })
      } else {
        return null
      }
    }
}
export let deviceComponent = new DeviceComponent()

class DialogComponent {
    constructor() {
    }
    alert(message, callback, title, buttonName) {
        navigator.notification.alert(message, callback, [title], [buttonName])
    }
    alertOK(message, callback, title) {
        navigator.notification.alert(message, callback, [title], ["OK"])
    }
    confirm(message, callback, title, buttonLabels) {
        navigator.notification.confirm(message, callback, [title], [buttonLabels])
    }
    confirmOKCancel(message, callback, title) {
        navigator.notification.confirm(message, callback, [title], ["OK", "Cancel"])
    }
    prompt(message, callback, title, buttonLabels, defaultText) {
        navigator.notification.prompt(message, callback, [title], [buttonLabels], [defaultText])
    }
    beep(times) {
        navigator.notification.beep(times)
    }
}
export let dialogComponent = new DialogComponent()

class InAppBrowserComponent {
    constructor() {
    }
    open(url, target, options) {
        if(!window.cordova){
            window.open(url,"_blank")
            return
        }
        let inAppBrowser = cordova.InAppBrowser.open(url, target, options)

        return inAppBrowser
    }
    addEventListener(inAppBrowser, evt, func) {
        inAppBrowser.addEventListener(evt, func)
    }
    removeEventListener(inAppBrowser, evt, func) {
        inAppBrowser.removeEventListener(evt, func)
    }
    insertCSS(inAppBrowser, css) {
        inAppBrowser.insertCSS(css)
    }
    executeScript(inAppBrowser, script) {
        inAppBrowser.executeScript(script)
    }
    show(inAppBrowser) {
        inAppBrowser.show()
    }
    hide(inAppBrowser) {
        inAppBrowser.hide()
    }
    close(inAppBrowser) {
        inAppBrowser.close()
    }
}
export let inAppBrowserComponent = new InAppBrowserComponent()

class PhoneContactComponent {
    constructor() {
    }
    create(contact) {
        let con = navigator.contacts.create(contact)

        return con
    }
    createContactName(name) {
        let contactName = new ContactName(name)

        return contactName
    }
    createContactField(field) {
        let contactField = new ContactField(field)

        return contactField
    }
    createContactAddress(address) {
        let contactAddress = new ContactAddress(address)

        return contactAddress
    }
    createContactOrganization(organization) {
        let contactOrganization = new ContactOrganization(organization)

        return contactOrganization
    }
    save(contact) {
        return new Promise(function (resolve, reject) {
            contact.save(function onSuccess(contact) {
                resolve(contact)
            }, function onError(contactError) {
                reject(contactError)
            })
        })
    }
    remove(contact) {
        return new Promise(function (resolve, reject) {
            contact.remove(function onSuccess() {
                resolve()
            }, function onError(contactError) {
                reject(contactError)
            })
        })
    }
    clone(contact) {
        return contact.clone()
    }
    find(filter, fields, options = { multiple: true, hasPhoneNumber: true }) {
        return new Promise(function (resolve, reject) {
            // find all contacts with 'Bob' in any name field
            let contactFindOptions = new ContactFindOptions()
            contactFindOptions.filter = filter
            contactFindOptions.multiple = options.multiple
            contactFindOptions.desiredFields = fields
            contactFindOptions.hasPhoneNumber = options.hasPhoneNumber
            navigator.contacts.find(fields, function onSuccess(contacts) {
                resolve(contacts)
            }, function onError(contactError) {
                reject(contactError)
            }, contactFindOptions)
        })
    }
    pickContact() {
        return new Promise(function (resolve, reject) {
            navigator.contacts.pickContact(function (contact) {
                resolve(contact)
            }, function (err) {
                reject(err)
            })
        })
    }
}
export let phoneContactComponent = new PhoneContactComponent()

class SmsComponent {
    constructor() {
    }
    sendSMS(address, text) {
        return new Promise(function (resolve, reject) {
            if (SMS) {
                SMS.sendSMS(address, text, () => {
                    resolve()
                }, () => {
                    reject()
                })
            } else if (sms) {
                let options = {
                    replaceLineBreaks: false, // true to replace \n by a new line, false by default
                    android: {
                        intent: 'INTENT'  // send SMS with the native android SMS messaging
                        //intent: '' // send SMS without opening any other app
                    }
                }
                sms.send(address, text, options, function () {
                    resolve()
                }, function (e) {
                    reject(e)
                })
            }
        })
    }
    listSMS(filter) {
        // let filter = {
        //     box : 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all

        //     // following 4 filters should NOT be used together, they are OR relationship
        //     read : 0, // 0 for unread SMS, 1 for SMS already read
        //     _id : 1234, // specify the msg id
        //     address : '+8613601234567', // sender's phone number
        //     body : 'This is a test SMS', // content to match

        //     // following 2 filters can be used to list page up/down
        //     indexFrom : 0, // start from index 0
        //     maxCount : 10, // count of SMS to return each time
        // }
        return new Promise(function (resolve, reject) {
            if (SMS) {
                SMS.listSMS(filter, function (data) {
                    resolve(data)
                }, function (err) {
                    reject(err)
                })
            }
        })
    }
    deleteSMS(filter) {
        // let filter = {
        //     box : 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all
        //     // the following 4 filters are OR relationship
        //     _id : 1234, // given a sms id, recommend ONLY use this filter
        //     read : 1, // delete all read SMS
        //     address : '+8613601234567', // delete all SMS from this phone number
        //     body : 'Test is a test SMS' // delete SMS by content
        // }
        return new Promise(function (resolve, reject) {
            if (SMS) {
                SMS.deleteSMS(filter, function (n) {
                    resolve(n)
                }, function (err) {
                    reject(err)
                })
            }
        })
    }

    startWatch() {
        return new Promise(function (resolve, reject) {
            let sms = SMSReceive
            if (!sms) {
                sms = SMS
            }
            if (sms) {
                sms.startWatch(function () {
                    resolve(true)
                }, function () {
                    reject(false)
                })
            }
        })
    }

    stopWatch() {
        return new Promise(function (resolve, reject) {
            let sms = SMSReceive
            if (!sms) {
                sms = SMS
            }
            if (sms) {
                sms.stopWatch(function () {
                    resolve(true)
                }, function () {
                    reject(false)
                })
            }
        })
    }
    enableIntercept(interceptEnabled, successCallback, failureCallback) {
        return new Promise(function (resolve, reject) {
            if (SMS) {
                SMS.enableIntercept(interceptEnabled, function () {
                    resolve(true)
                }, function () {
                    reject(false)
                })
            }
        })
    }
    restoreSMS(sms) {
        return new Promise(function (resolve, reject) {
            // after some intercept
            if (SMS) SMS.restoreSMS(sms, function (n) {
                resolve(n)

            }, function (err) {
                reject(err)
            })
        })
    }
    setOptions(options) {
        if (SMS) {
            SMS.setOptions(options)
        }
    }
    /**
     * smsComponent.onSMSArrive(async function (data)
     * @param {*} func
     */
    onSMSArrive(func) {
        document.addEventListener('onSMSArrive', function (e) {
            if (func) {
                func(e.data)
            }
        })
    }
}
export let smsComponent = new SmsComponent()

class SimComponent {
    constructor() {
    }
    getSimInfo() {
        return new Promise(function (resolve, reject) {
            window.plugins.sim.getSimInfo(function successCallback(result) {
                resolve(result)
            }, function errorCallback(err) {
                reject(err)
            })
        })
    }

    // Android only: check permission
    hasReadPermission() {
        return new Promise(function (resolve, reject) {
            window.plugins.sim.hasReadPermission(function successCallback(result) {
                resolve(result)
            }, function errorCallback(err) {
                reject(err)
            })
        })
    }

    // Android only: request permission
    // READ_PHONE_STATE
    requestReadPermission() {
        return new Promise(function (resolve, reject) {
            window.plugins.sim.requestReadPermission(function successCallback(result) {
                resolve(result)
            }, function errorCallback(err) {
                reject(err)
            })
        })
    }
}
export let simComponent = new SimComponent()

class PhotoLibraryComponent {
    constructor() {
    }
    getLibrary(options) {
        return new Promise(function (resolve, reject) {
            cordova.plugins.photoLibrary.getLibrary(
                function (result) {
                    let library = result.library
                    let isLastChunk = result.isLastChunk
                    // Here we have the library as array
                    resolve(result)
                    // library.forEach(function (libraryItem) {
                    //     console.log(libraryItem.id)           // ID of the photo
                    //     console.log(libraryItem.photoURL)     // Cross-platform access to photo
                    //     console.log(libraryItem.thumbnailURL) // Cross-platform access to thumbnail
                    //     console.log(libraryItem.fileName)
                    //     console.log(libraryItem.width)
                    //     console.log(libraryItem.height)
                    //     console.log(libraryItem.creationDate)
                    //     console.log(libraryItem.latitude)
                    //     console.log(libraryItem.longitude)
                    //     console.log(libraryItem.albumIds)     // array of ids of appropriate AlbumItem, only of includeAlbumsData was used
                    // })
                },
                function (err) {
                    console.log('Error occured')
                    reject(err)
                }, options
                // {
                //     thumbnailWidth: 512,
                //     thumbnailHeight: 384,
                //     quality: 0.8,
                //     includeAlbumData: false // default
                //     itemsInChunk: 100, // Loading large library takes time, so output can be chunked so that result callback will be called on
                //     chunkTimeSec: 0.5, // each X items, or after Y secons passes. You can start displaying photos immediately.
                //     useOriginalFileNames: false, // default, true will be much slower on iOS
                //     maxItems: 200, // limit the number of items to return
                // }
            )
        })
    }
    getAlbums() {
        return new Promise(function (resolve, reject) {
            cordova.plugins.photoLibrary.getAlbums(
                function (albums) {
                    resolve(albums)
                    // albums.forEach(function (album) {
                    //     console.log(album.id)
                    //     console.log(album.title)
                    // })
                },
                function (err) { reject(err) }
            )
        })
    }
    // file or remote URL. url can also be dataURL, but giving it a file path is much faster
    // 'https://cdn.openphoto.net/thumbs2/volumes/mike/20160822/openphotonet_MAJ_4663.JPG'
    saveImage(url, album) {
        return new Promise(function (resolve, reject) {
            cordova.plugins.photoLibrary.saveImage(url, album,
                function (libraryItem) {
                    resolve(libraryItem)
                },
                function (err) {
                    reject(err)
                })
        })
    }
    // iOS quirks: video provided cannot be .webm . Use .mov or .mp4 .
    saveVideo(url, album) {
        return new Promise(function (resolve, reject) {
            cordova.plugins.photoLibrary.saveVideo(url, album,
                function (libraryItem) {
                    resolve(libraryItem)
                },
                function (err) {
                    reject(err)
                })
        })
    }
    // <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    requestAuthorization(options) {
        return new Promise(function (resolve, reject) {
            cordova.plugins.photoLibrary.requestAuthorization(
                function () {
                    // User gave us permission to his library, retry reading it!
                    resolve(true)
                },
                function (err) {
                    // User denied the access
                    reject(err)
                }, // if options not provided, defaults to {read: true}.
                options
                // {
                //     read: true,
                //     write: true
                // }
            )
        })
    }
    getPhotoURL(libraryItem) {
        return new Promise(function (resolve, reject) {
            cordova.plugins.photoLibrary.getPhotoURL(
                libraryItem, // or libraryItem.id
                function (photoURL) {
                    resolve(photoURL)
                },
                function (err) {
                    console.log('Error occured')
                    reject(err)
                })
        })
    }
    getThumbnail(libraryItem, options = {
        thumbnailWidth: 512,
        thumbnailHeight: 384,
        quality: 0.8
    }) {
        return new Promise(function (resolve, reject) {
            // This method is slower as it does base64
            cordova.plugins.photoLibrary.getThumbnail(
                libraryItem, // or libraryItem.id
                function (thumbnailBlob) {
                    resolve(thumbnailBlob)
                },
                function (err) {
                    console.log('Error occured')
                    reject(err)
                }, options
            )
        })
    }
    getPhoto(libraryItem) {
        return new Promise(function (resolve, reject) {
            // This method is slower as it does base64
            cordova.plugins.photoLibrary.getPhoto(
                libraryItem, // or libraryItem.id
                function (fullPhotoBlob) {
                    resolve(fullPhotoBlob)
                },
                function (err) {
                    console.log('Error occured')
                    reject(err)
                })
        })
    }
}
export let photoLibraryComponent = new PhotoLibraryComponent()

class LocalNotificationComponent {
    constructor() {
    }
    /**
     * notification可以是一个对象或者对象数组
     * @param {*} notification
     */
    schedule(notification) {
        cordova.plugins.notification.local.schedule(notification)
    }

    getDefaults() {
        return cordova.plugins.notification.local.getDefaults()
    }
    setDefaults(defaults) {
        cordova.plugins.notification.local.setDefaults(defaults)
    }
    addActions(name, actions) {
        cordova.plugins.notification.local.addActions(name, actions)
    }
    update(id, text) {
        cordova.plugins.notification.local.update({
            id: id,
            text: text
        })
    }
    requestPermission() {
        return new Promise(function (resolve, reject) {
            cordova.plugins.notification.local.requestPermission(function (granted) {
                resolve(granted)
            })
        })
    }

    /**
     * add, trigger, click, clear, cancel, update, clearall and cancelall.
     * @param {*} event
     * @param {*} callback
     * @param {*} scope
     */
    on(event, callback, scope) {
        cordova.plugins.notification.local.on(event, callback, scope)
    }
    un(event, callback, scope) {
        cordova.plugins.notification.local.un(event, callback, scope)
    }
    fireEvent(event, args) {
        cordova.plugins.notification.local.core.fireEvent(event, args)
    }
    sendNotification(title,text,data){
      let _this = this
      if(window.device && cordova && cordova.plugins && cordova.plugins.notification && !cordova.plugins.notification.foreground){
        this.schedule({
          title:title,
          text: text,
          data:data,
          foreground: true
        })
      }
    }
    initialize(callback){
        let _this = this
      if(window.device && cordova && cordova.plugins && cordova.plugins.notification){
         cordova.plugins.notification.foreground = true
        _this.on('click',callback,_this)
      }
    }
}
export let localNotificationComponent = new LocalNotificationComponent()

class CalendarComponent {
    constructor() {
    }
    createEvent(options) {
        var calOptions = window.plugins.calendar.getCalendarOptions()
        calOptions.url = options.url
        calOptions.firstReminderMinutes = options.firstReminderMinutes
        calOptions.secondReminderMinutes = options.secondReminderMinutes
        calOptions.recurrence = options.recurrence
        calOptions.recurrenceEndDate = options.recurrenceEndDate
        calOptions.recurrenceInterval = options.recurrenceInterval
        var cal = window.plugins.calendar

        return new Promise(function (resolve, reject) {
            cal.createEventWithOptions(options.title,
                options.location,
                options.notes,
                options.start,
                options.end,
                calOptions,
                function (message) {
                    resolve(message)
                },
                function (message) {
                    console.error('Error occured:' + error)
                    reject(message)
                })
        })
    }
    // again, this is no longer needed with plugin version 4.5.0 and up
    hasReadWritePermission() {
        window.plugins.calendar.hasReadWritePermission(
            function (result) {
                // if this is 'false' you probably want to call 'requestReadWritePermission' now
                alert(result)
            }
        )
    }

    requestReadWritePermission() {
        // no callbacks required as this opens a popup which returns async
        window.plugins.calendar.requestReadWritePermission()
    }
}
export let calendarComponent = new CalendarComponent()
