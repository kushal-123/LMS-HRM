import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Grid,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import MailIcon from '@mui/icons-material/Mail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { fetchUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../../redux/thunks/userThunks';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const { departments, roles } = useSelector((state) => state.organization || {
    departments: [],
    roles: []
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // User form
  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    role: '',
    isActive: true
  });
  const [userErrors, setUserErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  
  // Notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  
  // Selected users for bulk actions
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  useEffect(() => {
    // Fetch users on component mount
    dispatch(fetchUsers({ page, rowsPerPage, search: searchQuery, ...filters }));
  }, [dispatch, page, rowsPerPage, searchQuery, filters]);
  
  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page when searching
  };
  
  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
    setPage(0); // Reset to first page when filters change
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Open user form dialog
  const handleOpenUserDialog = (user = null) => {
    if (user) {
      // Edit mode
      setUserForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '', // Don't show password in edit mode
        department: user.department,
        role: user.role,
        isActive: user.isActive
      });
      setIsEditMode(true);
      setSelectedUserId(user._id);
    } else {
      // Create mode
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        department: '',
        role: '',
        isActive: true
      });
      setIsEditMode(false);
      setSelectedUserId(null);
    }
    setUserErrors({});
    setUserDialog(true);
  };
  
  // Close user form dialog
  const handleCloseUserDialog = () => {
    setUserDialog(false);
  };
  
  // Handle user form input changes
  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm({
      ...userForm,
      [name]: value
    });
    
    // Clear error for this field
    setUserErrors({
      ...userErrors,
      [name]: ''
    });
  };
  
  // Handle switch (boolean) fields
  const handleSwitchChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.checked
    });
  };
  
  // Validate user form
  const validateForm = () => {
    const errors = {};
    
    if (!validateRequired(userForm.firstName)) {
      errors.firstName = 'First name is required';
    }
    
    if (!validateRequired(userForm.lastName)) {
      errors.lastName = 'Last name is required';
    }
    
    if (!validateEmail(userForm.email)) {
      errors.email = 'Valid email is required';
    }
    
    if (!isEditMode && !validatePassword(userForm.password)) {
      errors.password = 'Password must be at least 8 characters with numbers and letters';
    }
    
    if (!validateRequired(userForm.department)) {
      errors.department = 'Department is required';
    }
    
    if (!validateRequired(userForm.role)) {
      errors.role = 'Role is required';
    }
    
    setUserErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit user form
  const handleSubmitUser = () => {
    if (!validateForm()) {
      return;
    }
    
    if (isEditMode) {
      dispatch(updateUser({
        userId: selectedUserId,
        userData: userForm
      })).then(() => {
        setNotification({
          open: true,
          message: 'User updated successfully',
          type: 'success'
        });
        handleCloseUserDialog();
      }).catch((err) => {
        setNotification({
          open: true,
          message: `Error updating user: ${err.message}`,
          type: 'error'
        });
      });
    } else {
      dispatch(createUser(userForm)).then(() => {
        setNotification({
          open: true,
          message: 'User created successfully',
          type: 'success'
        });
        handleCloseUserDialog();
      }).catch((err) => {
        setNotification({
          open: true,
          message: `Error creating user: ${err.message}`,
          type: 'error'
        });
      });
    }
  };
  
  // Handle delete user
  const handleDeleteUser = () => {
    dispatch(deleteUser(selectedUserId)).then(() => {
      setNotification({
        open: true,
        message: 'User deleted successfully',
        type: 'success'
      });
      setDeleteDialog(false);
    }).catch((err) => {
      setNotification({
        open: true,
        message: `Error deleting user: ${err.message}`,
        type: 'error'
      });
      setDeleteDialog(false);
    });
  };
  
  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (userId) => {
    setSelectedUserId(userId);
    setDeleteDialog(true);
  };
  
  // Handle reset password
  const handleResetPassword = () => {
    dispatch(resetUserPassword(selectedUserId)).then(() => {
      setNotification({
        open: true,
        message: 'Password reset email sent successfully',
        type: 'success'
      });
      setResetPasswordDialog(false);
    }).catch((err) => {
      setNotification({
        open: true,
        message: `Error sending reset password email: ${err.message}`,
        type: 'error'
      });
      setResetPasswordDialog(false);
    });
  };
  
  // Open reset password dialog
  const handleOpenResetPasswordDialog = (userId) => {
    setSelectedUserId(userId);
    setResetPasswordDialog(true);
  };
  
  // Handle close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Handle select/deselect user for bulk actions
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  // Handle select/deselect all users
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
    setSelectAll(!selectAll);
  };
  
  // Handle bulk actions
  const handleBulkAction = () => {
    switch (bulkAction) {
      case 'delete':
        // Implement bulk delete
        Promise.all(selectedUsers.map(userId => dispatch(deleteUser(userId))))
          .then(() => {
            setNotification({
              open: true,
              message: `${selectedUsers.length} users deleted successfully`,
              type: 'success'
            });
            setSelectedUsers([]);
            setBulkActionDialog(false);
          })
          .catch((err) => {
            setNotification({
              open: true,
              message: `Error performing bulk delete: ${err.message}`,
              type: 'error'
            });
            setBulkActionDialog(false);
          });
        break;
      case 'activate':
        // Implement bulk activate
        Promise.all(selectedUsers.map(userId => 
          dispatch(updateUser({ userId, userData: { isActive: true } }))
        ))
          .then(() => {
            setNotification({
              open: true,
              message: `${selectedUsers.length} users activated successfully`,
              type: 'success'
            });
            setSelectedUsers([]);
            setBulkActionDialog(false);
          })
          .catch((err) => {
            setNotification({
              open: true,
              message: `Error performing bulk activation: ${err.message}`,
              type: 'error'
            });
            setBulkActionDialog(false);
          });
        break;
      case 'deactivate':
        // Implement bulk deactivate
        Promise.all(selectedUsers.map(userId => 
          dispatch(updateUser({ userId, userData: { isActive: false } }))
        ))
          .then(() => {
            setNotification({
              open: true,
              message: `${selectedUsers.length} users deactivated successfully`,
              type: 'success'
            });
            setSelectedUsers([]);
            setBulkActionDialog(false);
          })
          .catch((err) => {
            setNotification({
              open: true,
              message: `Error performing bulk deactivation: ${err.message}`,
              type: 'error'
            });
            setBulkActionDialog(false);
          });
        break;
      default:
        break;
    }
  };
  
  // Export users as CSV
  const handleExportUsers = () => {
    // Filter users based on current search and filters
    const filteredUsers = users.filter(user => {
      // Apply search filter
      const searchMatch = searchQuery ? 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) :
        true;
      
      // Apply department filter
      const departmentMatch = filters.department ? 
        user.department === filters.department : 
        true;
      
      // Apply role filter
      const roleMatch = filters.role ? 
        user.role === filters.role : 
        true;
      
      // Apply status filter
      const statusMatch = filters.status ? 
        (filters.status === 'active' ? user.isActive : !user.isActive) : 
        true;
      
      return searchMatch && departmentMatch && roleMatch && statusMatch;
    });
    
    // Convert users to CSV format
    const headers = ['First Name', 'Last Name', 'Email', 'Department', 'Role', 'Status', 'Last Login'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.firstName,
        user.lastName,
        user.email,
        // Get department name from department ID
        departments.find(d => d._id === user.department)?.name || '',
        // Get role name from role ID
        roles.find(r => r._id === user.role)?.name || '',
        user.isActive ? 'Active' : 'Inactive',
        user.lastLogin ? formatDate(user.lastLogin, 'MM/DD/YYYY HH:mm') : 'Never'
      ].join(','))
    ].join('\n');
    
    // Create CSV file and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${formatDate(new Date(), 'YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Get displayed users based on search, filters, and pagination
  const displayedUsers = users
    .filter(user => {
      // Apply search filter
      const searchMatch = searchQuery ? 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) :
        true;
      
      // Apply department filter
      const departmentMatch = filters.department ? 
        user.department === filters.department : 
        true;
      
      // Apply role filter
      const roleMatch = filters.role ? 
        user.role === filters.role : 
        true;
      
      // Apply status filter
      const statusMatch = filters.status ? 
        (filters.status === 'active' ? user.isActive : !user.isActive) : 
        true;
      
      return searchMatch && departmentMatch && roleMatch && statusMatch;
    })
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <>
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            User Management
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenUserDialog()}
          >
            Add New User
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Users"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportUsers}
              disabled={users.length === 0}
            >
              Export Users
            </Button>
            
            {selectedUsers.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {selectedUsers.length} selected
                </Typography>
                
                <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value=""
                    displayEmpty
                    onChange={(e) => {
                      setBulkAction(e.target.value);
                      setBulkActionDialog(true);
                    }}
                  >
                    <MenuItem value="" disabled>
                      Bulk Actions
                    </MenuItem>
                    <MenuItem value="activate">Activate</MenuItem>
                    <MenuItem value="deactivate">Deactivate</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Grid>
          
          {showFilters && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={filters.department}
                        label="Department"
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                      >
                        <MenuItem value="">All Departments</MenuItem>
                        {departments && departments.map((dept) => (
                          <MenuItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={filters.role}
                        label="Role"
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                      >
                        <MenuItem value="">All Roles</MenuItem>
                        {roles && roles.map((role) => (
                          <MenuItem key={role._id} value={role._id}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        label="Status"
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Tooltip title="Select All">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedUsers.length > 0 ? (
                  displayedUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccountCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {user.firstName} {user.lastName}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {departments.find(d => d._id === user.department)?.name || ''}
                      </TableCell>
                      <TableCell>
                        {roles.find(r => r._id === user.role)?.name || ''}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? formatDate(user.lastLogin, 'MM/DD/YYYY HH:mm') : 'Never'}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit User">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenUserDialog(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Reset Password">
                            <IconButton
                              color="secondary"
                              onClick={() => handleOpenResetPasswordDialog(user._id)}
                            >
                              <LockResetIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Send Email">
                            <IconButton
                              color="info"
                              onClick={() => {
                                window.location.href = `mailto:${user.email}`;
                              }}
                            >
                              <MailIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete User">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDeleteDialog(user._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No users found matching the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            <TablePagination
              component="div"
              count={users.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        )}
      </Card>
      
      {/* User Form Dialog */}
      <Dialog
        open={userDialog}
        onClose={handleCloseUserDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                autoFocus
                name="firstName"
                label="First Name"
                type="text"
                fullWidth
                variant="outlined"
                value={userForm.firstName}
                onChange={handleUserFormChange}
                error={!!userErrors.firstName}
                helperText={userErrors.firstName}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="lastName"
                label="Last Name"
                type="text"
                fullWidth
                variant="outlined"
                value={userForm.lastName}
                onChange={handleUserFormChange}
                error={!!userErrors.lastName}
                helperText={userErrors.lastName}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={userForm.email}
                onChange={handleUserFormChange}
                error={!!userErrors.email}
                helperText={userErrors.email}
                required
              />
            </Grid>
            {!isEditMode && (
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={userForm.password}
                  onChange={handleUserFormChange}
                  error={!!userErrors.password}
                  helperText={userErrors.password || 'Minimum 8 characters with letters and numbers'}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!userErrors.department}>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={userForm.department}
                  label="Department"
                  onChange={handleUserFormChange}
                >
                  {departments && departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {userErrors.department && (
                  <FormHelperText>{userErrors.department}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!userErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={userForm.role}
                  label="Role"
                  onChange={handleUserFormChange}
                >
                  {roles && roles.map((role) => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {userErrors.role && (
                  <FormHelperText>{userErrors.role}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userForm.isActive}
                    onChange={handleSwitchChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Active Account"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitUser}
            variant="contained"
            color="primary"
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialog}
        onClose={() => setResetPasswordDialog(false)}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will send a password reset email to the user. Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            color="primary"
            variant="contained"
          >
            Send Reset Email
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bulk Action Confirmation Dialog */}
      <Dialog
        open={bulkActionDialog}
        onClose={() => setBulkActionDialog(false)}
      >
        <DialogTitle>Confirm Bulk Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {bulkAction === 'delete' && `Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`}
            {bulkAction === 'activate' && `Are you sure you want to activate ${selectedUsers.length} users?`}
            {bulkAction === 'deactivate' && `Are you sure you want to deactivate ${selectedUsers.length} users?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBulkAction}
            color={bulkAction === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.type}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserManagement;
