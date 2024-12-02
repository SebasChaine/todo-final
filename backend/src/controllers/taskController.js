const Task = require('../models/Task');

const taskController = {
  // Obtener todas las tareas
  getTasks: async (req, res) => {
    try {
      const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las tareas' });
    }
  },

  // Crear una nueva tarea
  createTask: async (req, res) => {
    try {
      const { title } = req.body;
      const task = new Task({
        title,
        user: req.user._id
      });
      await task.save();
      
      // Emitir notificación
      const io = req.app.get('io');
      io.to(req.user._id.toString()).emit('taskCreated', {
        message: 'Nueva tarea creada',
        task
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la tarea' });
    }
  },

  // Actualizar una tarea
  updateTask: async (req, res) => {
    try {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        req.body,
        { new: true }
      );

      if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      // Emitir notificación
      const io = req.app.get('io');
      io.to(req.user._id.toString()).emit('taskUpdated', {
        message: 'Tarea actualizada',
        task
      });

      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
  },

  // Eliminar una tarea
  deleteTask: async (req, res) => {
    try {
      const task = await Task.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      // Emitir notificación
      const io = req.app.get('io');
      io.to(req.user._id.toString()).emit('taskDeleted', {
        message: 'Tarea eliminada',
        taskId: req.params.id
      });

      res.json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
  }
};

module.exports = taskController;