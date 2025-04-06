const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a course title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: [
        'Technical',
        'Soft Skills',
        'Compliance',
        'Leadership',
        'Onboarding',
        'Product Training',
        'Other'
      ]
    },
    level: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
    },
    thumbnail: {
      type: String,
      default: 'default-course.jpg'
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Please add course duration']
    },
    skillsTaught: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    }],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    }],
    enrollmentCount: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }],
    isPublished: {
      type: Boolean,
      default: false
    },
    requiredForRoles: [{
      type: String
    }],
    requiredForDepartments: [{
      type: String
    }],
    completionCriteria: {
      type: String,
      enum: ['All Modules', 'Minimum Score', 'Final Assessment'],
      default: 'All Modules'
    },
    minimumScore: {
      type: Number,
      default: 70
    },
    certificateTemplate: {
      type: String,
      default: 'default'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for computing completion percentage
CourseSchema.virtual('completionPercentage').get(function() {
  if (!this.modules || this.modules.length === 0) return 0;
  return (this.completedModules / this.modules.length) * 100;
});

module.exports = mongoose.model('Course', CourseSchema);
