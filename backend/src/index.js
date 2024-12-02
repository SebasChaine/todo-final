const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require('./app');
require('dotenv').config();

// Crear servidor HTTP y configurar Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`Usuario ${userId} se unió a su sala personal`);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Hacer io accesible para las rutas
app.set('io', io);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Función mejorada para iniciar el servidor con reintentos
const startServer = async (initialPort) => {
  const maxAttempts = 10;
  let currentPort = initialPort;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const server = httpServer.listen(currentPort, () => {
          console.log(`Servidor corriendo en puerto ${currentPort}`);
          // Guardar el puerto actual en la aplicación para referencia
          app.set('port', currentPort);
          resolve();
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Puerto ${currentPort} en uso, intentando siguiente puerto...`);
            currentPort++;
            reject(error);
          } else {
            console.error('Error al iniciar el servidor:', error);
            reject(error);
          }
        });

        // Manejar señales de terminación
        process.on('SIGTERM', () => {
          console.log('Cerrando servidor...');
          server.close(() => {
            console.log('Servidor cerrado.');
            process.exit(0);
          });
        });
      });
      return;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        console.error('No se pudo iniciar el servidor después de múltiples intentos');
        process.exit(1);
      }
      // Continuar con el siguiente intento
      continue;
    }
  }
};

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
startServer(PORT).catch(err => {
  console.error('Error fatal al iniciar el servidor:', err);
  process.exit(1);
});

// Exportar para pruebas
module.exports = { app, io, startServer };