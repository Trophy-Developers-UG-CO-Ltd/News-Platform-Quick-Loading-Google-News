/**
 * Users admin routes
 * @module modules/users/users.routes
 */

const express = require('express');
const router = express.Router();

const usersController = require('./users.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { updateUserSchema, getUserSchema, createUserSchema } = require('./users.validation');

// All routes require at minimum admin access (developer inherits automatically)
router.use(protect, authorize('admin'));

router.get('/', usersController.getAllUsers);
router.get('/:id', validate(getUserSchema), usersController.getUserById);
router.put('/:id', validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', validate(getUserSchema), usersController.deleteUser);

// Developer-only: create user with any role
router.post('/', protect, authorize('developer'), validate(createUserSchema), usersController.createUser);

module.exports = router;

// MukonoTalks

