import LGTV from 'lgtv2';
import wol from 'wake_on_lan';
import path from 'node:path';

const TV_IP = process.env.LG_TV_IP || '192.168.1.30';
const TV_MAC = process.env.LG_TV_MAC || '20:3D:BD:99:DE:FA';
const KEY_FILE = path.join(process.cwd(), 'local_database', 'lg_tv_keys.json');

const command = process.argv[2] || 'toast';
const customMessage = process.argv[3] || '🎮 Udhyana Games: LG TV Test Connection Successful!';

console.log('====================================================');
console.log('       Udhyana Games — LG Smart TV CLI Tester       ');
console.log('====================================================');
console.log(`Target TV IP  : ${TV_IP}`);
console.log(`Target TV MAC : ${TV_MAC}`);
console.log(`Action        : ${command}`);
console.log(`Key Storage   : ${KEY_FILE}`);
console.log('----------------------------------------------------');

if (command === 'wake' || command === 'on') {
  console.log(`📡 Broadcasting Wake-on-LAN magic packet to ${TV_MAC}...`);
  wol.wake(TV_MAC, (err) => {
    if (err) {
      console.error('❌ WoL failed:', err.message);
    } else {
      console.log('✅ Magic packet broadcasted! If the TV is in standby, it should turn on within 5 seconds.');
    }
  });
} else {
  console.log(`Connecting to LG webOS at ws://${TV_IP}:3000...`);
  console.log('⏳ (If this is your first time connecting, look at your LG TV screen and click [Accept] with your remote!)');

  const lgtv = LGTV({
    url: `ws://${TV_IP}:3000`,
    timeout: 8000,
    reconnect: false,
    keyFile: KEY_FILE
  });

  const timer = setTimeout(() => {
    console.error('❌ Connection timed out after 8s. Check if TV is powered ON and on same Wi-Fi.');
    try { lgtv.disconnect(); } catch {}
    process.exit(1);
  }, 8500);

  lgtv.on('error', (err) => {
    clearTimeout(timer);
    console.error('❌ LG TV Error:', err?.message || err);
    try { lgtv.disconnect(); } catch {}
    process.exit(1);
  });

  lgtv.on('prompt', () => {
    console.log('🔔 PAIRING PROMPT ACTIVE ON TV SCREEN! Click [Accept] on your LG remote control now!');
  });

  lgtv.on('connect', () => {
    clearTimeout(timer);
    console.log('✅ Connected and authenticated with LG TV!');

    if (command === 'toast') {
      console.log(`💬 Sending toast message: "${customMessage}"`);
      lgtv.request('ssap://system.notifications/createToast', { message: customMessage }, (err, res) => {
        if (err) console.error('❌ Toast failed:', err);
        else console.log('✅ Toast alert displayed on TV screen!', res);
        lgtv.disconnect();
        process.exit(0);
      });
    } else if (command === 'off') {
      console.log('🔴 Sending Power OFF command...');
      lgtv.request('ssap://system/turnOff', (err, res) => {
        if (err) console.error('❌ Power off failed:', err);
        else console.log('✅ TV Power OFF successful!', res);
        lgtv.disconnect();
        process.exit(0);
      });
    } else if (command === 'screen-off') {
      console.log('🕶️ Sending Screen Blackout (Method 1: tvpower turnOffScreen)...');
      lgtv.request('ssap://com.webos.service.tvpower/power/turnOffScreen', { standbyMode: 'active' }, (err, res) => {
        if (!err && res?.returnValue !== false) {
          console.log('✅ TV Screen turned off successfully (Method 1)!', res);
          lgtv.disconnect();
          process.exit(0);
        } else {
          console.log('⚠️ Method 1 failed or unsupported. Trying Method 2 (Energy Saving: screen_off)...', err?.message || err || res);
          lgtv.request('ssap://settings/setSystemSettings', {
            category: 'picture',
            settings: {
              energySaving: 'screen_off',
              energySavingModified: 'true'
            }
          }, (err2, res2) => {
            if (!err2 && res2?.returnValue !== false) {
              console.log('✅ TV Screen turned off via Energy Saving mode (Method 2)!', res2);
            } else {
              console.error('❌ Both Screen-Off methods are restricted on this LG webOS version:', err2?.message || err2 || res2);
              console.log('👉 Recommendation: In gaming lounges, use "off" (Power OFF), which is 100% supported on all LG TVs!');
            }
            lgtv.disconnect();
            process.exit(0);
          });
        }
      });
    } else if (command === 'screen-on') {
      console.log('☀️ Sending Screen Turn On command...');
      lgtv.request('ssap://com.webos.service.tvpower/power/turnOnScreen', {}, (err, res) => {
        if (!err && res?.returnValue !== false) {
          console.log('✅ TV Screen turned on (Method 1)!', res);
          lgtv.disconnect();
          process.exit(0);
        } else {
          lgtv.request('ssap://settings/setSystemSettings', {
            category: 'picture',
            settings: { energySaving: 'off', energySavingModified: 'true' }
          }, (err2, res2) => {
            if (!err2) console.log('✅ TV Screen restored (Method 2)!', res2);
            else console.error('❌ Screen on failed:', err2);
            lgtv.disconnect();
            process.exit(0);
          });
        }
      });
    } else if (command === 'hdmi1') {
      console.log('🎮 Switching TV input to HDMI 1 (PS5)...');
      lgtv.request('ssap://com.webos.applicationManager/launch', { id: 'com.webos.app.hdmi1' }, (err, res) => {
        if (err) console.error('❌ HDMI 1 launch failed:', err);
        else console.log('✅ Switched to HDMI 1!', res);
        lgtv.disconnect();
        process.exit(0);
      });
    } else if (command === 'photo' || command === 'image') {
      const imgUrl = customMessage && customMessage.startsWith('http') ? customMessage : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920';
      console.log(`🖼️ Launching fullscreen poster/photo: ${imgUrl}`);
      lgtv.request('ssap://system.launcher/open', { target: imgUrl }, (err, res) => {
        if (err) console.error('❌ Photo launch failed:', err);
        else console.log('✅ Photo/Poster displayed on TV screen!', res);
        lgtv.disconnect();
        process.exit(0);
      });
    } else if (command === 'gallery') {
      console.log('🎨 Launching LG Art Gallery Mode...');
      lgtv.request('ssap://com.webos.applicationManager/launch', { id: 'com.webos.app.igallery' }, (err, res) => {
        if (!err) {
          console.log('✅ LG Art Gallery opened!', res);
          lgtv.disconnect();
          process.exit(0);
        } else {
          console.log('Trying fallback Photo & Video viewer...');
          lgtv.request('ssap://com.webos.applicationManager/launch', { id: 'com.webos.app.photovideo' }, (err2, res2) => {
            if (!err2) console.log('✅ Photo/Video viewer opened!', res2);
            else console.error('❌ Gallery mode failed:', err2);
            lgtv.disconnect();
            process.exit(0);
          });
        }
      });
    } else {
      console.log(`Unknown command "${command}". Available commands: wake, toast, off, screen-off, screen-on, hdmi1, photo, gallery`);
      lgtv.disconnect();
      process.exit(0);
    }
  });
}
