// routes/experimentRoutes.js

import express from 'express';

import Experiment from '../models/Experiment.js';

const router = express.Router();


// =========================
// GET ALL EXPERIMENTS
// =========================

router.get('/', async (req, res) => {

  try {

    const experiments =
      await Experiment.find()
      .sort({ createdAt: -1 });

    res.json(experiments);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =========================
// GET SINGLE EXPERIMENT
// =========================

router.get('/:id', async (req, res) => {

  try {

    const experiment =
      await Experiment.findById(
        req.params.id
      );

    res.json(experiment);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =========================
// SAVE EXPERIMENT
// =========================

router.post('/', async (req, res) => {

  try {

    const experiment =
      new Experiment(req.body);

    await experiment.save();

    res.status(201).json(
      experiment
    );

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

// =========================
// DELETE EXPERIMENT
// =========================

router.delete(
  '/:id',

  async (req, res) => {

    try {

      const deletedExperiment =
        await Experiment.findByIdAndDelete(
          req.params.id
        );

      if (!deletedExperiment) {

        return res.status(404).json({
          message:
            'Experiment not found'
        });

      }

      res.json({
        message:
          'Experiment deleted successfully'
      });

    } catch (error) {

      res.status(500).json({
        error:
          error.message
      });

    }

  }
  
);
export default router;
