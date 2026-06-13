// models/Experiment.js

import mongoose from 'mongoose';

const ExperimentSchema =
  new mongoose.Schema({

    name: {
      type: String,
      required: true
    },

    author: {
      type: String,
      default: 'Anonymous'
    },

    worldState: {
      type: Object,
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }

  });

export default mongoose.model(
  'Experiment',
  ExperimentSchema
);