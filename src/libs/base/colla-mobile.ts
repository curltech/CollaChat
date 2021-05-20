/**
 cordova-plugin-android-permissions插件的实现
 */

class PermissionHelper {
    private permissions:any
    constructor() {

    }
    init(permissions:any){
        this.permissions = permissions
    }

    /**
     * // Example 完整的列表见源码
     permissions.ACCESS_COARSE_LOCATION
     permissions.CAMERA
     permissions.GET_ACCOUNTS
     permissions.READ_CONTACTS
     permissions.READ_CALENDAR
     * @param permission
     */
    get Permissions(){
        return this.permissions
    }
    /**
     * 检查权限，参数为字符串或者字符串列表，返回是否具有权限
     * @param permission
     */
    checkPermission(permission:string|string[]):Promise<boolean>{
        let that=this
        return new Promise(function (resolve, reject) {
            that.permissions.checkPermission(permission,
                function (status:any) {
                    resolve(status)
                },
                function () {
                    reject()
                }
            )
        })
    }
    /**
     * 申请权限，参数为字符串，返回是否申请成功
     * @param permission
     */
    requestPermission(permission:string):Promise<boolean>{
        let that=this
        return new Promise(function (resolve, reject) {
            that.permissions.requestPermission(permission,
                function (status:any) {
                    resolve(status.hasPermission)
                },
                function () {
                    reject()
                }
            )
        })
    }
    /**
     * 申请权限，参数为字符串数组，返回是否申请成功
     * @param permission
     */
    requestPermissions(permissions:string[]):Promise<boolean>{
        let that=this
        return new Promise(function (resolve, reject) {
            that.permissions.requestPermissions(permissions,
                function (status:any) {
                    resolve(status.hasPermission)
                },
                function () {
                    reject()
                }
            )
        })
    }

}
export let permissionHelper = new PermissionHelper()

/**
 cordova-diagnostic-plugin提供一些功能
 LOCATION - Android, iOS, Windows 10 UWP
 BLUETOOTH - Android, iOS, Windows 10 UWP
 WIFI - Android, iOS, Windows 10 UWP
 CAMERA - Android, iOS, Windows 10 UWP
 NOTIFICATIONS - Android, iOS
 MICROPHONE - Android, iOS
 CONTACTS - Android, iOS
 CALENDAR - Android, iOS
 REMINDERS - iOS
 MOTION - iOS
 NFC - Android
 EXTERNAL_STORAGE - Android
 */
class DiagnosticHelper {
    private diagnostic:any //= cordova.plugins.diagnostic

    constructor() {
    }

    /**
     * // Example 完整的列表见源码
     cordova.plugins.diagnostic.permission.ACCESS_FINE_LOCATION,
     cordova.plugins.diagnostic.permission.ACCESS_COARSE_LOCATION
     * @param permission
     */
    get Diagnostic() {
        return this.diagnostic
    }
}
export let diagnosticHelper = new DiagnosticHelper()