const mongoose = require('mongoose');

const LearningPathSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a learning path name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    thumbnail: {
      type: String,
      default: 'default-path.jpg'
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetRoles: [{
      type: String,
      required: true
    }],
    targetDepartments: [{
      type: String
    }],
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    skillsDeveloped: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    }],
    estimatedCompletionDays: {
      type: Number,
      default: 90
    },
    isActive: {
      type: Boolean,
      default: true
    },
    enrollmentCount: {
      type: Number,
      default: 0
    },
    completionCriteria: {
      type: String,
      enum: ['All Courses', 'Key Courses'],
      default: 'All Courses'
    },
    keyCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    certificateTemplate: {
      type: String,
      default: 'learning-path'
    },
    completionBadge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    prerequisites: {
      description: {
        type: String,
        default: ''
      },
      skills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      }],
      recommendedExperience: {
        type: String,
        default: ''
      }
    },
    career: {
      type: {
        type: String,
        enum: ['Entry', 'Intermediate', 'Advanced', 'Leadership'],
        default: 'Intermediate'
      },
      outcomes: [{
        type: String
      }]
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for total duration
LearningPathSchema.virtual('totalDuration').get(function() {
  if (!this.courses || this.courses.length === 0) return 0;
  
  let total = 0;
  this.courses.forEach(course => {
    if (course.duration) {
      total += course.duration;
    }
  });
  
  return total;
});

// Virtual for total courses
LearningPathSchema.virtual('courseCount').get(function() {
  return this.courses ? this.courses.length : 0;
});

module.exports = mongoose.model('LearningPath', LearningPathSchema);
