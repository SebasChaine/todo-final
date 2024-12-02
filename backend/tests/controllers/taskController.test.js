const request = require('supertest');
const mongoose = require('mongoose');
const { createServer } = require('http');
const app = require('../../src/app'); 
const User = require('../../src/models/User');
const Task = require('../../src/models/Task');

describe('Task Controller', () => {
  let server;
  let token;
  let userId;

  // Configuración antes de cada prueba
  beforeEach(async () => {
    server = createServer(app);
    
    // Crear un usuario de prueba
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    userId = user._id;
    token = global.generateTestToken(userId);
  });

  // Limpieza después de cada prueba
  afterEach(async () => {
    await server.close();
  });

  describe('GET /api/tasks', () => {
    it('debería obtener todas las tareas del usuario', async () => {
      // Crear algunas tareas de prueba
      await Task.create([
        { title: 'Tarea 1', user: userId },
        { title: 'Tarea 2', user: userId }
      ]);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title', 'Tarea 1');
    });

    it('debería devolver un array vacío si el usuario no tiene tareas', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /api/tasks', () => {
    it('debería crear una nueva tarea', async () => {
      const taskData = { title: 'Nueva tarea' };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', 'Nueva tarea');
      expect(response.body.user.toString()).toBe(userId.toString());
    });

    it('debería fallar si no se proporciona un título', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('debería actualizar una tarea existente', async () => {
      const task = await Task.create({
        title: 'Tarea original',
        user: userId
      });

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Tarea actualizada', completed: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Tarea actualizada');
      expect(response.body).toHaveProperty('completed', true);
    });

    it('debería fallar al actualizar una tarea que no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Tarea actualizada' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('debería eliminar una tarea existente', async () => {
      const task = await Task.create({
        title: 'Tarea a eliminar',
        user: userId
      });

      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      
      // Verificar que la tarea fue eliminada
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('debería fallar al eliminar una tarea que no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});