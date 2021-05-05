require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  try {
    console.log('notarize.js: ' + `${appOutDir}/${appName}.app`);
    await notarize({
      appBundleId: 'io.curltech.colla',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: 'visualfengs@gmail.com',
      appleIdPassword: 'forl-tvka-wtuv-rcew'
    });
  } catch (error) {
    console.error(error)
  }
};