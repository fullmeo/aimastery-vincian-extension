/**
 * Well-balanced class
 * - Consistent method sizes (8-15 LOC each)
 * - Good symmetry
 */

export class UserService {
  private users: Map<string, User> = new Map();

  addUser(user: User): void {
    if (!user.id) {
      throw new Error('User ID is required');
    }
    this.users.set(user.id, user);
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  removeUser(id: string): boolean {
    return this.users.delete(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserCount(): number {
    return this.users.size;
  }
}

interface User {
  id: string;
  name: string;
  email: string;
}
