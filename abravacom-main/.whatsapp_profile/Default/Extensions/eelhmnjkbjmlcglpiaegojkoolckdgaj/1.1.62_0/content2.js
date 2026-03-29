// 监听inject.js中的消息,传给popup
window.addEventListener(
  'message',
  function (e) {
    if (e.data.downLoad_openPayMonthly) {
      chrome.runtime.sendMessage(
        { type: 'downLoad_openPayMonthly' },
        function () {}
      )
    }
    if (e.data.download_openPayForever) {
      chrome.runtime.sendMessage(
        { type: 'download_openPayForever' },
        function () {}
      )
    }
    if (e.data.download_openPayOneDay) {
      chrome.runtime.sendMessage(
        { type: 'download_openPayOneDay' },
        function () {}
      )
    }
  },
  false
)
