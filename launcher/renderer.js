const { Terminal } = require('xterm');
require('xterm/css/xterm.css');

const t1 = new Terminal();
const t2 = new Terminal();

t1.open(document.getElementById('t1'));
t2.open(document.getElementById('t2'));

document.getElementById('start-frontend').addEventListener('click', async () => {
  const r = await window.api.startServer('frontend');
  if (!r.ok) t1.writeln(r.msg || JSON.stringify(r));
});

document.getElementById('stop-frontend').addEventListener('click', async () => {
  const r = await window.api.stopServer('frontend');
  t1.writeln(r.msg || (r.ok? 'Stopped' : 'Not stopped'));
});

document.getElementById('start-api').addEventListener('click', async () => {
  const r = await window.api.startServer('api');
  if (!r.ok) t2.writeln(r.msg || JSON.stringify(r));
});

document.getElementById('stop-api').addEventListener('click', async () => {
  const r = await window.api.stopServer('api');
  t2.writeln(r.msg || (r.ok? 'Stopped' : 'Not stopped'));
});

window.api.onProcData(({ name, data }) => {
  if (name === 'frontend') t1.write(data);
  else t2.write(data);
});
window.api.onProcExit(({ name, code }) => {
  if (name === 'frontend') t1.writeln('\r\n--- exited ' + code);
  else t2.writeln('\r\n--- exited ' + code);
});
