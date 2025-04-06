const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a badge name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    imageUrl: {
      type: String,
      required: [true, 'Please add a badge image URL'],
      default: 'default-badge.png'
    },
    badgeType: {
      type: String,
      enum: [
        'Course Completion',
        'Learning Path',
        'Skill Mastery',
        'Engagement',
        'Achievement',
        'Special'
      ],
      required: [true, 'Please specify a badge type']
    },
    rarity: {
      type: String,
      enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
      default: 'Common'
    },
    points: {
      type: Number,
      default: 10
    },
    // For Course Completion badges
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    // For Learning Path badges
    learningPathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath'
    },
    // For Skill Mastery badges
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    // For Achievement badges
    requirements: {
      type: String,
      maxlength: [1000, 'Requirements cannot be more than 1000 characters']
    },
    requirementCriteria: {
      type: mongoose.Schema.Types.Mixed
    },
    // For Special badges
    isLimited: {
      type: Boolean,
      default: false
    },
    expiresOn: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Badge', BadgeSchema);
