import { Request, Response } from 'express';
import { Employee } from '../../models/Employee';
import { User } from '../../models/User';
import { Branch } from '../../models/Branch';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError
} from '../../utils/AppError';

/**
 * Invite / Create a new Employee (Owner Only)
 */
export const inviteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, branchId } = req.body;
  const ownerId = req.user?.userId;

  // 1. Verify branch exists and is owned by caller
  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new NotFoundError('Target branch not found.');
  }
  if (branch.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: You do not own this branch.');
  }

  // 2. Check if email conflicts with User or Employee
  const existingUser = await User.findOne({ email });
  const existingEmployee = await Employee.findOne({ email });
  if (existingUser || existingEmployee) {
    throw new ConflictError('An account with this email address already exists.');
  }

  // 3. Create the Employee
  const employee = new Employee({
    ownerId,
    branchId,
    name,
    email,
    passwordHash: password, // will hash in pre-save hook
    role,
    status: 'ACTIVE',
    isActive: true,
  });

  await employee.save();

  res.status(201).json({
    success: true,
    message: 'Employee invited successfully',
    data: employee,
  });
});

/**
 * List employees matching active context
 */
export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { actorType, userId, branchId } = req.user || {};
  let query: any = {};

  if (actorType === 'owner') {
    query.ownerId = userId;
    if (req.query.branchId) {
      query.branchId = req.query.branchId;
    }
  } else {
    // Employees can only see other employees in their branch
    query.branchId = branchId;
  }

  const employees = await Employee.find(query)
    .populate('branchId', 'branchName branchCode')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: employees,
  });
});

/**
 * Get detailed info of a single employee
 */
export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { actorType, userId, branchId } = req.user || {};
  const { id } = req.params;

  const employee = await Employee.findById(id).populate('branchId', 'branchName branchCode');
  if (!employee) {
    throw new NotFoundError('Employee not found.');
  }

  // Security checks
  if (actorType === 'owner') {
    if (employee.ownerId.toString() !== userId) {
      throw new ForbiddenError('Access denied: Employee belongs to another company.');
    }
  } else {
    if (employee.branchId.toString() !== branchId) {
      throw new ForbiddenError('Access denied: Employee belongs to another branch.');
    }
  }

  res.status(200).json({
    success: true,
    data: employee,
  });
});

/**
 * Update employee metadata/role/status (Owner Only)
 */
export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { name, role, status } = req.body;
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found.');
  }

  if (employee.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: Employee belongs to another company.');
  }

  if (name) employee.name = name;
  if (role) employee.role = role as any;
  if (status) {
    employee.status = status;
    if (status === 'INACTIVE' || status === 'SUSPENDED') {
      employee.isActive = false;
      employee.tokenVersion += 1; // force logout
    } else if (status === 'ACTIVE') {
      employee.isActive = true;
    }
  }

  await employee.save();

  res.status(200).json({
    success: true,
    message: 'Employee updated successfully',
    data: employee,
  });
});

/**
 * Deactivate employee (Owner Only)
 */
export const deactivateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found.');
  }

  if (employee.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: Employee belongs to another company.');
  }

  employee.status = 'INACTIVE';
  employee.isActive = false;
  employee.tokenVersion += 1; // invalidate current session token refresh

  await employee.save();

  res.status(200).json({
    success: true,
    message: 'Employee deactivated successfully',
    data: employee,
  });
});

/**
 * Reactivate employee (Owner Only)
 */
export const activateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found.');
  }

  if (employee.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: Employee belongs to another company.');
  }

  employee.status = 'ACTIVE';
  employee.isActive = true;

  await employee.save();

  res.status(200).json({
    success: true,
    message: 'Employee activated successfully',
    data: employee,
  });
});

/**
 * Hard Delete an Employee (Owner Only)
 */
export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found.');
  }

  if (employee.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: Employee belongs to another company.');
  }

  await employee.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Employee deleted successfully',
    data: null,
  });
});

/**
 * Owner reset Employee password (Owner Only)
 */
export const resetEmployeePassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found.');
  }

  if (employee.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: Employee belongs to another company.');
  }

  employee.passwordHash = password; // Pre-save hooks hashes it
  employee.tokenVersion += 1; // force logout of all active devices

  await employee.save();

  res.status(200).json({
    success: true,
    message: 'Employee password reset successfully',
    data: null,
  });
});

/**
 * Owner moves employee to different branch (Owner Only)
 */
export const moveEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { branchId } = req.body;
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found.');
  }

  if (employee.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: Employee belongs to another company.');
  }

  // Verify branch ownership
  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new NotFoundError('Target branch not found.');
  }
  if (branch.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: You do not own the target branch.');
  }

  employee.branchId = branchId;
  employee.tokenVersion += 1; // force reauth to align to new branch token context

  await employee.save();

  res.status(200).json({
    success: true,
    message: 'Employee moved to new branch successfully',
    data: employee,
  });
});
