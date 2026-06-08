import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private db: { [tableName: string]: any[] } = {};

  constructor() {
    this.loadDatabase();
  }

  private loadDatabase() {
    const data = localStorage.getItem('pak_tak_sqlite.db');
    if (data) {
      this.db = JSON.parse(data);
    } else {
      this.db = {
        users: [this.createDefaultUser()]
      };
      this.saveDatabase();
    }

    if (!this.db['users']) {
      this.db['users'] = [];
    }

    const defaultExists = this.db['users'].some(
      u => u.username.toLowerCase() === 'saad'
    );
    if (!defaultExists) {
      this.db['users'].push(this.createDefaultUser());
      this.saveDatabase();
    }
  }

  private saveDatabase() {
    localStorage.setItem('pak_tak_sqlite.db', JSON.stringify(this.db));
  }

  private createDefaultUser() {
    return {
      id: 1,
      username: 'saad',
      password: 'saad',
      clearance: 'LEVEL-5 COMMAND',
      registeredAt: new Date().toISOString()
    };
  }

  /**
   * Emulates a SQLite query statement
   * @param query SQL query string
   * @param params Parameter bounds
   */
  public runSql(query: string, params: any[] = []): any[] {
    const cleaned = query.trim().replace(/\s+/g, ' ');
    const upperQuery = cleaned.toUpperCase();

    if (upperQuery.startsWith('INSERT INTO USERS')) {
      const username = params[0];
      const password = params[1];
      const clearance = params[2] || 'LEVEL-1 OPERATOR';
      
      // Check UNIQUE constraint
      const exists = this.db['users'].some(
        u => u.username.toLowerCase() === username.toLowerCase()
      );
      if (exists) {
        throw new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username');
      }

      const newUser = {
        id: this.db['users'].length + 1,
        username,
        password,
        clearance,
        registeredAt: new Date().toISOString()
      };
      
      this.db['users'].push(newUser);
      this.saveDatabase();
      return [newUser];
    }
    
    if (upperQuery.startsWith('SELECT * FROM USERS')) {
      if (upperQuery.includes('WHERE USERNAME = ? AND PASSWORD = ?')) {
        const username = params[0];
        const password = params[1];
        return this.db['users'].filter(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      }
      if (upperQuery.includes('WHERE USERNAME = ?')) {
        const username = params[0];
        return this.db['users'].filter(u => u.username.toLowerCase() === username.toLowerCase());
      }
      return this.db['users'];
    }

    return [];
  }
}
