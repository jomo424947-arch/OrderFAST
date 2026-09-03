import net from 'net';

const ports = [5432, 5433, 54322, 6543];

for (const port of ports) {
  const socket = new net.Socket();
  socket.setTimeout(1000);
  socket.on('connect', () => {
    console.log(`Port ${port} is OPEN locally`);
    socket.destroy();
  });
  socket.on('error', () => {
    console.log(`Port ${port} is closed locally`);
  });
  socket.on('timeout', () => {
    console.log(`Port ${port} timed out locally`);
    socket.destroy();
  });
  socket.connect(port, '127.0.0.1');
}
