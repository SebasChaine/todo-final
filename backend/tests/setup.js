const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Conectar a la base de datos de prueba antes de las pruebas
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Limpiar la base de datos después de cada prueba
afterEach(async () => {
  await mongoose.connection.dropDatabase();
});

// Cerrar la conexión después de todas las pruebas
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

// Función auxiliar para generar tokens JWT de prueba
global.generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret');
};