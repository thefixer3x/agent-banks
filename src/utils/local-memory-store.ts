/**
 * Local Memory Storage with Git Version Control
 * 
 * This system stores memories locally in JSON files with automatic Git versioning
 * Perfect for development, offline work, or when database is unavailable
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LocalMemory {
  id: string;
  title: string;
  content: string;
  summary?: string;
  memory_type: 'conversation' | 'knowledge' | 'project' | 'context' | 'reference';
  tags: string[];
  project_ref: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
  git_commit?: string;
}

export interface LocalMemoryStoreOptions {
  baseDir?: string;
  gitEnabled?: boolean;
  autoCommit?: boolean;
  branch?: string;
}

export class LocalMemoryStore {
  private baseDir: string;
  private gitEnabled: boolean;
  private autoCommit: boolean;
  private branch: string;
  private indexPath: string;

  constructor(options: LocalMemoryStoreOptions = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), '.local-memories');
    this.gitEnabled = options.gitEnabled ?? true;
    this.autoCommit = options.autoCommit ?? true;
    this.branch = options.branch || 'memory-store';
    this.indexPath = path.join(this.baseDir, 'index.json');
  }

  /**
   * Initialize the local memory store
   */
  async initialize(): Promise<void> {
    // Create directory structure
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'memories'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'by-date'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'by-project'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'by-type'), { recursive: true });

    // Initialize Git repository if enabled
    if (this.gitEnabled) {
      await this.initGit();
    }

    // Create or load index
    await this.loadOrCreateIndex();
  }

  /**
   * Initialize Git repository for version control
   */
  private async initGit(): Promise<void> {
    try {
      // Check if git repo exists
      await execAsync('git rev-parse --git-dir', { cwd: this.baseDir });
    } catch {
      // Initialize new repo
      await execAsync('git init', { cwd: this.baseDir });
      await execAsync(`git checkout -b ${this.branch}`, { cwd: this.baseDir });
      
      // Create .gitignore
      const gitignore = `
# Temporary files
*.tmp
*.log
.DS_Store

# Lock files
*.lock

# Private data (if any)
.env
.secrets
`;
      await fs.writeFile(path.join(this.baseDir, '.gitignore'), gitignore);
      
      // Initial commit
      await execAsync('git add .', { cwd: this.baseDir });
      await execAsync('git commit -m "Initialize local memory store"', { cwd: this.baseDir });
    }
  }

  /**
   * Load or create the memory index
   */
  private async loadOrCreateIndex(): Promise<Record<string, any>> {
    try {
      const indexData = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(indexData);
    } catch {
      const index = {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        total_memories: 0,
        last_updated: new Date().toISOString(),
        memories: {},
        tags: {},
        projects: {}
      };
      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
      return index;
    }
  }

  /**
   * Generate a unique ID for memories
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store a memory locally with version control
   */
  async storeMemory(memory: Omit<LocalMemory, 'id' | 'created_at' | 'updated_at' | 'version' | 'git_commit'>): Promise<LocalMemory> {
    await this.initialize();

    const id = this.generateId();
    const timestamp = new Date().toISOString();
    const date = new Date().toISOString().split('T')[0];

    const fullMemory: LocalMemory = {
      ...memory,
      id,
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
      tags: memory.tags || [],
      project_ref: memory.project_ref || 'general'
    };

    // Save memory file
    const memoryPath = path.join(this.baseDir, 'memories', `${id}.json`);
    await fs.writeFile(memoryPath, JSON.stringify(fullMemory, null, 2));

    // Create symbolic links for organization
    await this.createSymlinks(fullMemory);

    // Update index
    await this.updateIndex(fullMemory);

    // Git commit if enabled
    if (this.gitEnabled && this.autoCommit) {
      fullMemory.git_commit = await this.commitMemory(fullMemory);
    }

    console.log(`✅ Memory stored locally: ${id}`);
    return fullMemory;
  }

  /**
   * Create symbolic links for easy browsing
   */
  private async createSymlinks(memory: LocalMemory): Promise<void> {
    const memoryFile = `${memory.id}.json`;
    const sourcePath = path.join('..', '..', 'memories', memoryFile);

    // By date
    const date = memory.created_at.split('T')[0];
    const datePath = path.join(this.baseDir, 'by-date', date);
    await fs.mkdir(datePath, { recursive: true });
    try {
      await fs.symlink(sourcePath, path.join(datePath, memoryFile));
    } catch (e) {
      // Symlink might already exist
    }

    // By project
    const projectPath = path.join(this.baseDir, 'by-project', memory.project_ref);
    await fs.mkdir(projectPath, { recursive: true });
    try {
      await fs.symlink(sourcePath, path.join(projectPath, memoryFile));
    } catch (e) {
      // Symlink might already exist
    }

    // By type
    const typePath = path.join(this.baseDir, 'by-type', memory.memory_type);
    await fs.mkdir(typePath, { recursive: true });
    try {
      await fs.symlink(sourcePath, path.join(typePath, memoryFile));
    } catch (e) {
      // Symlink might already exist
    }
  }

  /**
   * Update the memory index
   */
  private async updateIndex(memory: LocalMemory): Promise<void> {
    const index = await this.loadOrCreateIndex();
    
    // Update memory entry
    index.memories[memory.id] = {
      title: memory.title,
      type: memory.memory_type,
      project: memory.project_ref,
      tags: memory.tags,
      created_at: memory.created_at
    };

    // Update tag index
    for (const tag of memory.tags) {
      if (!index.tags[tag]) {
        index.tags[tag] = [];
      }
      index.tags[tag].push(memory.id);
    }

    // Update project index
    if (!index.projects[memory.project_ref]) {
      index.projects[memory.project_ref] = [];
    }
    index.projects[memory.project_ref].push(memory.id);

    // Update metadata
    index.total_memories = Object.keys(index.memories).length;
    index.last_updated = new Date().toISOString();

    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Commit memory to Git
   */
  private async commitMemory(memory: LocalMemory): Promise<string> {
    try {
      await execAsync('git add .', { cwd: this.baseDir });
      
      const commitMessage = `Add memory: ${memory.title}\n\nType: ${memory.memory_type}\nProject: ${memory.project_ref}\nTags: ${memory.tags.join(', ')}\nID: ${memory.id}`;
      
      const { stdout } = await execAsync(
        `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
        { cwd: this.baseDir }
      );
      
      // Extract commit hash
      const match = stdout.match(/\[[\w\s-]+\s+([a-f0-9]+)\]/);
      return match ? match[1] : 'unknown';
    } catch (error) {
      console.warn('Git commit failed:', error);
      return '';
    }
  }

  /**
   * Search memories by various criteria
   */
  async searchMemories(criteria: {
    query?: string;
    type?: string;
    project?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<LocalMemory[]> {
    const index = await this.loadOrCreateIndex();
    let memoryIds = Object.keys(index.memories);

    // Filter by type
    if (criteria.type) {
      memoryIds = memoryIds.filter(id => 
        index.memories[id].type === criteria.type
      );
    }

    // Filter by project
    if (criteria.project) {
      memoryIds = memoryIds.filter(id => 
        index.memories[id].project === criteria.project
      );
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      memoryIds = memoryIds.filter(id => {
        const memoryTags = index.memories[id].tags;
        return criteria.tags!.some(tag => memoryTags.includes(tag));
      });
    }

    // Filter by date range
    if (criteria.dateFrom || criteria.dateTo) {
      memoryIds = memoryIds.filter(id => {
        const createdAt = index.memories[id].created_at;
        if (criteria.dateFrom && createdAt < criteria.dateFrom) return false;
        if (criteria.dateTo && createdAt > criteria.dateTo) return false;
        return true;
      });
    }

    // Load full memories
    const memories: LocalMemory[] = [];
    for (const id of memoryIds) {
      try {
        const memoryPath = path.join(this.baseDir, 'memories', `${id}.json`);
        const data = await fs.readFile(memoryPath, 'utf-8');
        const memory = JSON.parse(data);
        
        // Text search in content if query provided
        if (criteria.query) {
          const searchText = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase();
          if (!searchText.includes(criteria.query.toLowerCase())) {
            continue;
          }
        }
        
        memories.push(memory);
      } catch (error) {
        console.warn(`Failed to load memory ${id}:`, error);
      }
    }

    return memories.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get memory history from Git
   */
  async getMemoryHistory(memoryId: string): Promise<Array<{
    commit: string;
    date: string;
    message: string;
    changes: string;
  }>> {
    if (!this.gitEnabled) {
      return [];
    }

    try {
      const memoryPath = path.join('memories', `${memoryId}.json`);
      const { stdout } = await execAsync(
        `git log --pretty=format:"%H|%ad|%s" --date=iso -- ${memoryPath}`,
        { cwd: this.baseDir }
      );

      const history = stdout.split('\n').filter(line => line).map(line => {
        const [commit, date, message] = line.split('|');
        return { commit, date, message, changes: '' };
      });

      // Get diff for each commit
      for (let i = 0; i < history.length; i++) {
        const commit = history[i].commit;
        const prevCommit = i < history.length - 1 ? history[i + 1].commit : '';
        
        if (prevCommit) {
          const { stdout: diff } = await execAsync(
            `git diff ${prevCommit} ${commit} -- ${memoryPath}`,
            { cwd: this.baseDir }
          );
          history[i].changes = diff;
        }
      }

      return history;
    } catch (error) {
      console.error('Failed to get memory history:', error);
      return [];
    }
  }

  /**
   * Export memories to various formats
   */
  async exportMemories(format: 'json' | 'markdown' | 'csv' = 'json'): Promise<string> {
    const memories = await this.searchMemories({});
    
    switch (format) {
      case 'markdown':
        return this.exportToMarkdown(memories);
      case 'csv':
        return this.exportToCSV(memories);
      default:
        return JSON.stringify(memories, null, 2);
    }
  }

  private exportToMarkdown(memories: LocalMemory[]): string {
    let markdown = '# Local Memory Store Export\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += `Total Memories: ${memories.length}\n\n`;

    const byProject = memories.reduce((acc, mem) => {
      if (!acc[mem.project_ref]) acc[mem.project_ref] = [];
      acc[mem.project_ref].push(mem);
      return acc;
    }, {} as Record<string, LocalMemory[]>);

    for (const [project, mems] of Object.entries(byProject)) {
      markdown += `## Project: ${project}\n\n`;
      
      for (const mem of mems) {
        markdown += `### ${mem.title}\n`;
        markdown += `- **ID**: ${mem.id}\n`;
        markdown += `- **Type**: ${mem.memory_type}\n`;
        markdown += `- **Tags**: ${mem.tags.join(', ')}\n`;
        markdown += `- **Created**: ${mem.created_at}\n`;
        if (mem.git_commit) {
          markdown += `- **Git Commit**: ${mem.git_commit}\n`;
        }
        markdown += `\n${mem.content}\n\n---\n\n`;
      }
    }

    return markdown;
  }

  private exportToCSV(memories: LocalMemory[]): string {
    const headers = ['ID', 'Title', 'Type', 'Project', 'Tags', 'Created', 'Content'];
    const rows = [headers];

    for (const mem of memories) {
      rows.push([
        mem.id,
        `"${mem.title.replace(/"/g, '""')}"`,
        mem.memory_type,
        mem.project_ref,
        `"${mem.tags.join(', ')}"`,
        mem.created_at,
        `"${mem.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]);
    }

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Sync with remote Git repository
   */
  async syncWithRemote(remote: string = 'origin'): Promise<void> {
    if (!this.gitEnabled) {
      throw new Error('Git is not enabled for this memory store');
    }

    try {
      // Add remote if not exists
      try {
        await execAsync(`git remote add ${remote} ${remote}`, { cwd: this.baseDir });
      } catch {
        // Remote might already exist
      }

      // Pull latest changes
      await execAsync(`git pull ${remote} ${this.branch} --rebase`, { cwd: this.baseDir });
      
      // Push local changes
      await execAsync(`git push ${remote} ${this.branch}`, { cwd: this.baseDir });
      
      console.log('✅ Synced with remote repository');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }
}

// Export convenience functions
export async function storeLocalMemory(
  title: string,
  content: string,
  options: Partial<Omit<LocalMemory, 'id' | 'title' | 'content' | 'created_at' | 'updated_at' | 'version'>> = {}
): Promise<LocalMemory> {
  const store = new LocalMemoryStore();
  return store.storeMemory({
    title,
    content,
    memory_type: options.memory_type || 'knowledge',
    tags: options.tags || [],
    project_ref: options.project_ref || 'general',
    summary: options.summary,
    metadata: options.metadata
  });
}

export default LocalMemoryStore;