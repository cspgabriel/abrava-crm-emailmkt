function openPayMonthly() {
  const loadingContainer = document.querySelector('.loading-container')
  loadingContainer.classList.remove('hide')
  chrome.runtime.sendMessage({ type: 'downLoad_openPayMonthly' }, () => {})
}
function openPayForever() {
  const loadingContainer = document.querySelector('.loading-container')
  loadingContainer.classList.remove('hide')
  chrome.runtime.sendMessage({ type: 'download_openPayForever' }, () => {})
}
function freeUseNow() {
  window.close()
}

document.querySelector('.download-free-use-now').addEventListener('click', () => {
  freeUseNow()
})

document.querySelector('.download-pay-monthly').addEventListener('click', () => {
  openPayMonthly()
})

document.querySelector('.download-pay-forever').addEventListener('click', () => {
  openPayForever()
})
