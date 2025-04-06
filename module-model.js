const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a module title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Please add module duration']
    },
    contents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    }],
    quizRequired: {
      type: Boolean,
      default: false
    },
    quiz: {
      questions: [{
        question: {
          type: String,
          required: function() { return this.quizRequired; }
        },
        options: [{
          text: String,
          isCorrect: Boolean
        }],
        type: {
          type: String,
          enum: ['Multiple Choice', 'True/False', 'Short Answer'],
          default: 'Multiple Choice'
        },
        points: {
          type: Number,
          default: 1
        }
      }],
      passingScore: {
        type: Number,
        default: 70
      },
      allowRetake: {
        type: Boolean,
        default: true
      },
      timeLimit: {
        type: Number, // in minutes
        default: 30
      }
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Module', ModuleSchema);
