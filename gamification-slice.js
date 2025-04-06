import { createSlice } from '@reduxjs/toolkit';
import {
  fetchUserBadges,
  fetchBadgeById,
  fetchAllBadges,
  awardBadge,
  fetchUserPoints,
  addPoints,
  fetchUserRewards,
  redeemReward,
  fetchLeaderboard,
  fetchUserAchievements,
  fetchUserStreak,
  updateStreak,
  fetchAvailableRewards,
  fetchUserLevel,
  fetchPointsHistory,
  fetchNextMilestone
} from '../thunks/gamificationThunks';

const initialState = {
  // Badges
  badges: {
    all: [],
    earned: [],
    available: [],
    featured: [],
    currentBadge: null,
    totalEarned: 0,
    loading: false,
    error: null
  },
  
  // Points
  points: {
    total: 0,
    currentLevel: 1,
    nextLevelAt: 100,
    levelProgress: 0,
    history: [],
    loading: false,
    error: null
  },
  
  // Rewards
  rewards: {
    available: [],
    earned: [],
    redeemed: [],
    currentReward: null,
    loading: false,
    error: null
  },
  
  // Leaderboard
  leaderboard: {
    weekly: [],
    monthly: [],
    allTime: [],
    departmentRanking: [],
    userRank: null,
    loading: false,
    error: null
  },
  
  // Achievements
  achievements: {
    completed: [],
    inProgress: [],
    upcoming: [],
    totalCompleted: 0,
    loading: false,
    error: null
  },
  
  // Streaks
  streaks: {
    current: 0,
    longest: 0,
    lastActive: null,
    dailyGoalMet: false,
    history: [],
    loading: false,
    error: null
  },
  
  // Overall gamification state
  loading: false,
  error: null,
  successMessage: null
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    clearGamificationErrors: (state) => {
      state.error = null;
      state.badges.error = null;
      state.points.error = null;
      state.rewards.error = null;
      state.leaderboard.error = null;
      state.achievements.error = null;
      state.streaks.error = null;
    },
    clearGamificationSuccess: (state) => {
      state.successMessage = null;
    },
    resetBadgeState: (state) => {
      state.badges.currentBadge = null;
    },
    resetRewardState: (state) => {
      state.rewards.currentReward = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user badges
      .addCase(fetchUserBadges.pending, (state) => {
        state.badges.loading = true;
        state.badges.error = null;
      })
      .addCase(fetchUserBadges.fulfilled, (state, action) => {
        state.badges.loading = false;
        state.badges.earned = action.payload.earned || [];
        state.badges.available = action.payload.available || [];
        state.badges.totalEarned = state.badges.earned.length;
      })
      .addCase(fetchUserBadges.rejected, (state, action) => {
        state.badges.loading = false;
        state.badges.error = action.payload || 'Failed to fetch user badges';
      })
      
      // Fetch badge by ID
      .addCase(fetchBadgeById.pending, (state) => {
        state.badges.loading = true;
        state.badges.error = null;
      })
      .addCase(fetchBadgeById.fulfilled, (state, action) => {
        state.badges.loading = false;
        state.badges.currentBadge = action.payload;
      })
      .addCase(fetchBadgeById.rejected, (state, action) => {
        state.badges.loading = false;
        state.badges.error = action.payload || 'Failed to fetch badge details';
      })
      
      // Fetch all badges
      .addCase(fetchAllBadges.pending, (state) => {
        state.badges.loading = true;
        state.badges.error = null;
      })
      .addCase(fetchAllBadges.fulfilled, (state, action) => {
        state.badges.loading = false;
        state.badges.all = action.payload;
        
        // Extract featured badges (example: badges with featured flag)
        state.badges.featured = action.payload.filter(badge => badge.featured);
      })
      .addCase(fetchAllBadges.rejected, (state, action) => {
        state.badges.loading = false;
        state.badges.error = action.payload || 'Failed to fetch all badges';
      })
      
      // Award badge
      .addCase(awardBadge.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(awardBadge.fulfilled, (state, action) => {
        state.loading = false;
        
        // Add to earned badges if not already there
        if (!state.badges.earned.some(badge => badge._id === action.payload._id)) {
          state.badges.earned = [...state.badges.earned, action.payload];
          state.badges.totalEarned = state.badges.earned.length;
        }
        
        // Remove from available badges
        state.badges.available = state.badges.available.filter(
          badge => badge._id !== action.payload._id
        );
        
        state.successMessage = `Congratulations! You've earned the "${action.payload.name}" badge!`;
      })
      .addCase(awardBadge.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to award badge';
      })
      
      // Fetch user points
      .addCase(fetchUserPoints.pending, (state) => {
        state.points.loading = true;
        state.points.error = null;
      })
      .addCase(fetchUserPoints.fulfilled, (state, action) => {
        state.points.loading = false;
        state.points.total = action.payload.total;
        state.points.currentLevel = action.payload.level;
        state.points.nextLevelAt = action.payload.nextLevelAt;
        state.points.levelProgress = action.payload.progress;
      })
      .addCase(fetchUserPoints.rejected, (state, action) => {
        state.points.loading = false;
        state.points.error = action.payload || 'Failed to fetch user points';
      })
      
      // Add points
      .addCase(addPoints.pending, (state) => {
        state.points.loading = true;
        state.points.error = null;
      })
      .addCase(addPoints.fulfilled, (state, action) => {
        state.points.loading = false;
        state.points.total = action.payload.total;
        state.points.currentLevel = action.payload.level;
        state.points.nextLevelAt = action.payload.nextLevelAt;
        state.points.levelProgress = action.payload.progress;
        
        // If level increased, show special message
        if (action.payload.levelIncreased) {
          state.successMessage = `Congratulations! You've reached level ${action.payload.level}!`;
        } else {
          state.successMessage = `You've earned ${action.payload.added} points!`;
        }
      })
      .addCase(addPoints.rejected, (state, action) => {
        state.points.loading = false;
        state.points.error = action.payload || 'Failed to add points';
      })
      
      // Fetch user rewards
      .addCase(fetchUserRewards.pending, (state) => {
        state.rewards.loading = true;
        state.rewards.error = null;
      })
      .addCase(fetchUserRewards.fulfilled, (state, action) => {
        state.rewards.loading = false;
        state.rewards.earned = action.payload.earned || [];
        state.rewards.redeemed = action.payload.redeemed || [];
      })
      .addCase(fetchUserRewards.rejected, (state, action) => {
        state.rewards.loading = false;
        state.rewards.error = action.payload || 'Failed to fetch user rewards';
      })
      
      // Fetch available rewards
      .addCase(fetchAvailableRewards.pending, (state) => {
        state.rewards.loading = true;
        state.rewards.error = null;
      })
      .addCase(fetchAvailableRewards.fulfilled, (state, action) => {
        state.rewards.loading = false;
        state.rewards.available = action.payload;
      })
      .addCase(fetchAvailableRewards.rejected, (state, action) => {
        state.rewards.loading = false;
        state.rewards.error = action.payload || 'Failed to fetch available rewards';
      })
      
      // Redeem reward
      .addCase(redeemReward.pending, (state) => {
        state.rewards.loading = true;
        state.rewards.error = null;
      })
      .addCase(redeemReward.fulfilled, (state, action) => {
        state.rewards.loading = false;
        state.rewards.redeemed = [...state.rewards.redeemed, action.payload];
        state.rewards.currentReward = action.payload;
        
        // Update points balance
        state.points.total = action.payload.remainingPoints;
        
        state.successMessage = `You've successfully redeemed the "${action.payload.reward.name}" reward!`;
      })
      .addCase(redeemReward.rejected, (state, action) => {
        state.rewards.loading = false;
        state.rewards.error = action.payload || 'Failed to redeem reward';
      })
      
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboard.loading = true;
        state.leaderboard.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard.loading = false;
        
        if (action.payload.timeframe === 'weekly') {
          state.leaderboard.weekly = action.payload.leaderboard;
        } else if (action.payload.timeframe === 'monthly') {
          state.leaderboard.monthly = action.payload.leaderboard;
        } else {
          state.leaderboard.allTime = action.payload.leaderboard;
        }
        
        if (action.payload.departmentRanking) {
          state.leaderboard.departmentRanking = action.payload.departmentRanking;
        }
        
        if (action.payload.userRank) {
          state.leaderboard.userRank = action.payload.userRank;
        }
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.leaderboard.loading = false;
        state.leaderboard.error = action.payload || 'Failed to fetch leaderboard';
      })
      
      // Fetch user achievements
      .addCase(fetchUserAchievements.pending, (state) => {
        state.achievements.loading = true;
        state.achievements.error = null;
      })
      .addCase(fetchUserAchievements.fulfilled, (state, action) => {
        state.achievements.loading = false;
        state.achievements.completed = action.payload.completed || [];
        state.achievements.inProgress = action.payload.inProgress || [];
        state.achievements.upcoming = action.payload.upcoming || [];
        state.achievements.totalCompleted = state.achievements.completed.length;
      })
      .addCase(fetchUserAchievements.rejected, (state, action) => {
        state.achievements.loading = false;
        state.achievements.error = action.payload || 'Failed to fetch user achievements';
      })
      
      // Fetch user streak
      .addCase(fetchUserStreak.pending, (state) => {
        state.streaks.loading = true;
        state.streaks.error = null;
      })
      .addCase(fetchUserStreak.fulfilled, (state, action) => {
        state.streaks.loading = false;
        state.streaks.current = action.payload.current;
        state.streaks.longest = action.payload.longest;
        state.streaks.lastActive = action.payload.lastActive;
        state.streaks.dailyGoalMet = action.payload.dailyGoalMet;
        state.streaks.history = action.payload.history || [];
      })
      .addCase(fetchUserStreak.rejected, (state, action) => {
        state.streaks.loading = false;
        state.streaks.error = action.payload || 'Failed to fetch user streak';
      })
      
      // Update streak
      .addCase(updateStreak.pending, (state) => {
        state.streaks.loading = true;
        state.streaks.error = null;
      })
      .addCase(updateStreak.fulfilled, (state, action) => {
        state.streaks.loading = false;
        state.streaks.current = action.payload.current;
        state.streaks.longest = action.payload.longest;
        state.streaks.lastActive = action.payload.lastActive;
        state.streaks.dailyGoalMet = action.payload.dailyGoalMet;
        
        // If streak milestone reached, show message
        if (action.payload.milestoneReached) {
          state.successMessage = `Great job! You've maintained a ${action.payload.current} day streak!`;
        }
      })
      .addCase(updateStreak.rejected, (state, action) => {
        state.streaks.loading = false;
        state.streaks.error = action.payload || 'Failed to update streak';
      })
      
      // Fetch user level
      .addCase(fetchUserLevel.pending, (state) => {
        state.points.loading = true;
        state.points.error = null;
      })
      .addCase(fetchUserLevel.fulfilled, (state, action) => {
        state.points.loading = false;
        state.points.currentLevel = action.payload.level;
        state.points.nextLevelAt = action.payload.nextLevelAt;
        state.points.levelProgress = action.payload.progress;
      })
      .addCase(fetchUserLevel.rejected, (state, action) => {
        state.points.loading = false;
        state.points.error = action.payload || 'Failed to fetch user level';
      })
      
      // Fetch points history
      .addCase(fetchPointsHistory.pending, (state) => {
        state.points.loading = true;
        state.points.error = null;
      })
      .addCase(fetchPointsHistory.fulfilled, (state, action) => {
        state.points.loading = false;
        state.points.history = action.payload;
      })
      .addCase(fetchPointsHistory.rejected, (state, action) => {
        state.points.loading = false;
        state.points.error = action.payload || 'Failed to fetch points history';
      })
      
      // Fetch next milestone
      .addCase(fetchNextMilestone.pending, (state) => {
        state.achievements.loading = true;
        state.achievements.error = null;
      })
      .addCase(fetchNextMilestone.fulfilled, (state, action) => {
        state.achievements.loading = false;
        state.achievements.nextMilestone = action.payload;
      })
      .addCase(fetchNextMilestone.rejected, (state, action) => {
        state.achievements.loading = false;
        state.achievements.error = action.payload || 'Failed to fetch next milestone';
      });
  }
});

export const { 
  clearGamificationErrors, 
  clearGamificationSuccess, 
  resetBadgeState,
  resetRewardState
} = gamificationSlice.actions;

export default gamificationSlice.reducer;
