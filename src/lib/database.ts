import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Create database instance
const dbPath = join(dataDir, 'users.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// User interface
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  date_of_birth: string;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Initialize database tables
export function initializeDatabase() {
  try {
    // Create users table with the correct schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        is_email_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on email for faster lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database first
initializeDatabase();

// Database operations - created after table initialization
function createDatabaseOperations() {
  return {
    // Create a new user
    createUser: db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, date_of_birth)
      VALUES (?, ?, ?, ?, ?)
    `),

    // Find user by email
    findUserByEmail: db.prepare(`
      SELECT * FROM users WHERE email = ?
    `),

    // Find user by id
    findUserById: db.prepare(`
      SELECT * FROM users WHERE id = ?
    `),

    // Update user's last login
    updateUserLastLogin: db.prepare(`
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `),

    // Get all users (for admin purposes)
    getAllUsers: db.prepare(`
      SELECT id, first_name, last_name, email, date_of_birth, created_at, updated_at FROM users
    `),
  };
}

export const userDb = createDatabaseOperations();

// User service functions
export class UserService {
  static async createUser(userData: CreateUserData): Promise<{ success: boolean; message: string; userId?: number }> {
    try {
      // Check if user already exists
      const existingUser = userDb.findUserByEmail.get(userData.email) as User | undefined;
      if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Insert user
      const result = userDb.createUser.run(
        userData.firstName,
        userData.lastName,
        userData.email,
        hashedPassword,
        userData.dateOfBirth
      );

      return { 
        success: true, 
        message: 'User created successfully', 
        userId: result.lastInsertRowid as number 
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  static async loginUser(loginData: LoginData): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> {
    try {
      // Find user by email
      const user = userDb.findUserByEmail.get(loginData.email) as User | undefined;
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      userDb.updateUserLastLogin.run(user.id);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return { 
        success: true, 
        message: 'Login successful', 
        user: userWithoutPassword 
      };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  static getUserById(id: number): Omit<User, 'password'> | undefined {
    try {
      const user = userDb.findUserById.get(id) as User | undefined;
      if (!user) return undefined;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  static getUserByEmail(email: string): Omit<User, 'password'> | undefined {
    try {
      const user = userDb.findUserByEmail.get(email) as User | undefined;
      if (!user) return undefined;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }
}

export default db;