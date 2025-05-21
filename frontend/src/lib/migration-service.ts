/**
 * Migration Service
 * Orchestrates the migration from localStorage to PostgreSQL
 */

import { authService } from './auth-service';
import { migrationHelper } from './migration-helper';
import { promptService } from './prompt-service';
import { chatService } from './chat-service';
import { providerService } from './provider-service';

class MigrationService {
  private migrationInProgress = false;
  private migrationComplete = false;
  private migrationErrors: string[] = [];
  
  /**
   * Check if migration has been completed
   */
  isMigrationComplete(): boolean {
    return this.migrationComplete || localStorage.getItem('migration_complete') === 'true';
  }
  
  /**
   * Get migration status
   */
  getMigrationStatus(): { complete: boolean, inProgress: boolean, errors: string[] } {
    return {
      complete: this.migrationComplete,
      inProgress: this.migrationInProgress,
      errors: [...this.migrationErrors]
    };
  }
  
  /**
   * Start the migration process
   */
  async startMigration(): Promise<boolean> {
    // Check if migration is already complete
    if (this.isMigrationComplete()) {
      console.log('Migration already completed');
      return true;
    }
    
    // Check if migration is in progress
    if (this.migrationInProgress) {
      console.log('Migration already in progress');
      return false;
    }
    
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      this.migrationErrors.push('User must be authenticated to perform migration');
      return false;
    }
    
    this.migrationInProgress = true;
    this.migrationErrors = [];
    
    try {
      console.log('Starting migration from localStorage to PostgreSQL...');
      
      // Step 1: Migrate user data
      console.log('Step 1: Migrating user data...');
      const userMigrated = await migrationHelper.migrateUserData();
      if (!userMigrated) {
        this.migrationErrors.push('Failed to migrate user data');
      }
      
      // Step 2: Migrate prompts
      console.log('Step 2: Migrating prompts...');
      const promptsMigrated = await promptService.migratePromptsFromLocalStorage();
      if (!promptsMigrated) {
        this.migrationErrors.push('Failed to migrate prompts');
      }
      
      // Step 3: Migrate chat history
      console.log('Step 3: Migrating chat history...');
      const chatMigrated = await chatService.migrateChatHistoryFromLocalStorage();
      if (!chatMigrated) {
        this.migrationErrors.push('Failed to migrate chat history');
      }
      
      // Step 4: Migrate provider configurations
      console.log('Step 4: Migrating provider configurations...');
      const providersMigrated = await providerService.migrateProviderConfigsFromLocalStorage();
      if (!providersMigrated) {
        this.migrationErrors.push('Failed to migrate provider configurations');
      }
      
      // Mark migration as complete
      this.migrationComplete = this.migrationErrors.length === 0;
      
      if (this.migrationComplete) {
        localStorage.setItem('migration_complete', 'true');
        console.log('Migration completed successfully');
      } else {
        console.error('Migration completed with errors:', this.migrationErrors);
      }
      
      return this.migrationComplete;
    } catch (error: any) {
      console.error('Migration failed:', error);
      this.migrationErrors.push(`Unexpected error: ${error?.message || 'Unknown error'}`);
      return false;
    } finally {
      this.migrationInProgress = false;
    }
  }
  
  /**
   * Reset migration status (for testing)
   */
  resetMigrationStatus(): void {
    // This should only be used for testing
    localStorage.removeItem('migration_complete');
    localStorage.removeItem('prompts_migrated');
    localStorage.removeItem('chat_history_migrated');
    localStorage.removeItem('provider_configs_migrated');
    localStorage.removeItem('migration_completed');
    
    this.migrationComplete = false;
    this.migrationInProgress = false;
    this.migrationErrors = [];
    
    console.log('Migration status reset');
  }
}

// Export a singleton instance
export const migrationService = new MigrationService();
