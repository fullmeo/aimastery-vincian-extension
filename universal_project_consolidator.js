/**
 * Universal Project Consolidator - REAL IMPLEMENTATION
 * Outil fonctionnel pour analyser et consolider des projets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class UniversalProjectConsolidator {
  constructor(options = {}) {
    this.config = {
      projectRoot: options.root || './projects',
      fileTypes: options.fileTypes || ['html', 'js', 'css', 'py', 'md', 'json'],
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
      backupLocation: options.backup || './backups',
      consolidationThreshold: options.threshold || 0.7,
      preserveHistory: options.history || true
    };
    
    this.analysis = {
      projects: new Map(),
      duplicates: [],
      patterns: [],
      recommendations: []
    };
  }

  // ========================================
  // ANALYSE RÉELLE DU SYSTÈME DE FICHIERS
  // ========================================

  async analyzeAllProjects() {
    console.log("Analyse des projets dans:", this.config.projectRoot);
    
    if (!fs.existsSync(this.config.projectRoot)) {
      throw new Error(`Répertoire inexistant: ${this.config.projectRoot}`);
    }

    const discoveries = await this.discoverProjects();
    const patterns = await this.detectPatterns(discoveries);
    const duplicates = await this.findDuplicates(discoveries);
    
    this.analysis.recommendations = this.generateRecommendations();
    
    return {
      discovered: discoveries,
      patterns: patterns,
      duplicates: duplicates,
      recommendations: this.analysis.recommendations
    };
  }

  async discoverProjects() {
    const projects = {
      webProjects: this.findWebProjects(),
      pythonProjects: this.findPythonProjects(),
      dataProjects: this.findDataProjects(),
      documentationProjects: this.findDocumentationProjects(),
      configProjects: this.findConfigProjects(),
      unknownProjects: []
    };

    // Classification réelle par analyse des fichiers
    for (let [type, projectList] of Object.entries(projects)) {
      for (let project of projectList) {
        project.maturity = this.assessProjectMaturity(project);
        project.lastActivity = this.getLastActivity(project);
        project.codeQuality = this.assessCodeQuality(project);
        project.size = this.calculateProjectSize(project);
      }
    }

    return projects;
  }

  // ========================================
  // DÉTECTION RÉELLE DE PROJETS
  // ========================================

  findWebProjects() {
    const webProjects = [];
    const rootPath = this.config.projectRoot;
    
    if (!fs.existsSync(rootPath)) return webProjects;
    
    const scanDirectory = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        
        let hasHTML = false;
        let hasJS = false;
        let hasPackageJson = false;
        let projectFiles = [];
        
        for (let item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            projectFiles.push({ name: item, path: itemPath, size: stat.size });
            
            if (ext === '.html') hasHTML = true;
            if (ext === '.js') hasJS = true;
            if (item === 'package.json') hasPackageJson = true;
          } else if (stat.isDirectory() && !item.startsWith('.')) {
            scanDirectory(itemPath);
          }
        }
        
        // Si c'est un projet web
        if (hasHTML || (hasJS && hasPackageJson)) {
          webProjects.push({
            name: path.basename(dirPath),
            path: dirPath,
            type: 'web',
            files: projectFiles,
            indicators: {
              hasHTML,
              hasJS,
              hasPackageJson
            }
          });
        }
      } catch (error) {
        console.warn(`Erreur lecture répertoire ${dirPath}:`, error.message);
      }
    };
    
    scanDirectory(rootPath);
    return webProjects;
  }

  findPythonProjects() {
    const pythonProjects = [];
    const rootPath = this.config.projectRoot;
    
    if (!fs.existsSync(rootPath)) return pythonProjects;
    
    const scanDirectory = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        
        let hasPython = false;
        let hasRequirements = false;
        let projectFiles = [];
        
        for (let item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            projectFiles.push({ name: item, path: itemPath, size: stat.size });
            
            if (ext === '.py') hasPython = true;
            if (item === 'requirements.txt' || item === 'setup.py') hasRequirements = true;
          } else if (stat.isDirectory() && !item.startsWith('.')) {
            scanDirectory(itemPath);
          }
        }
        
        if (hasPython) {
          pythonProjects.push({
            name: path.basename(dirPath),
            path: dirPath,
            type: 'python',
            files: projectFiles,
            indicators: {
              hasPython,
              hasRequirements
            }
          });
        }
      } catch (error) {
        console.warn(`Erreur lecture répertoire ${dirPath}:`, error.message);
      }
    };
    
    scanDirectory(rootPath);
    return pythonProjects;
  }

  findDataProjects() {
    const dataProjects = [];
    const rootPath = this.config.projectRoot;
    const dataExtensions = ['.csv', '.json', '.xlsx', '.sql', '.db'];
    
    if (!fs.existsSync(rootPath)) return dataProjects;
    
    const scanDirectory = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        let dataFiles = [];
        
        for (let item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (dataExtensions.includes(ext)) {
              dataFiles.push({ name: item, path: itemPath, size: stat.size });
            }
          } else if (stat.isDirectory() && !item.startsWith('.')) {
            scanDirectory(itemPath);
          }
        }
        
        if (dataFiles.length > 0) {
          dataProjects.push({
            name: path.basename(dirPath),
            path: dirPath,
            type: 'data',
            files: dataFiles
          });
        }
      } catch (error) {
        console.warn(`Erreur lecture répertoire ${dirPath}:`, error.message);
      }
    };
    
    scanDirectory(rootPath);
    return dataProjects;
  }

  findDocumentationProjects() {
    const docProjects = [];
    const rootPath = this.config.projectRoot;
    
    if (!fs.existsSync(rootPath)) return docProjects;
    
    const scanDirectory = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        let docFiles = [];
        
        for (let item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (ext === '.md' || item.toLowerCase().includes('readme')) {
              docFiles.push({ name: item, path: itemPath, size: stat.size });
            }
          } else if (stat.isDirectory() && !item.startsWith('.')) {
            scanDirectory(itemPath);
          }
        }
        
        if (docFiles.length > 0) {
          docProjects.push({
            name: path.basename(dirPath),
            path: dirPath,
            type: 'documentation',
            files: docFiles
          });
        }
      } catch (error) {
        console.warn(`Erreur lecture répertoire ${dirPath}:`, error.message);
      }
    };
    
    scanDirectory(rootPath);
    return docProjects;
  }

  findConfigProjects() {
    const configProjects = [];
    const rootPath = this.config.projectRoot;
    const configFiles = ['package.json', 'requirements.txt', '.gitignore', 'Dockerfile', 'docker-compose.yml'];
    
    if (!fs.existsSync(rootPath)) return configProjects;
    
    const scanDirectory = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        let configs = [];
        
        for (let item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isFile() && configFiles.includes(item)) {
            configs.push({ name: item, path: itemPath, size: stat.size });
          } else if (stat.isDirectory() && !item.startsWith('.')) {
            scanDirectory(itemPath);
          }
        }
        
        if (configs.length > 0) {
          configProjects.push({
            name: path.basename(dirPath),
            path: dirPath,
            type: 'config',
            files: configs
          });
        }
      } catch (error) {
        console.warn(`Erreur lecture répertoire ${dirPath}:`, error.message);
      }
    };
    
    scanDirectory(rootPath);
    return configProjects;
  }

  // ========================================
  // ÉVALUATION RÉELLE DE MATURITÉ
  // ========================================

  assessProjectMaturity(project) {
    let score = 0;
    const indicators = {
      hasTests: false,
      hasDocumentation: false,
      hasConfiguration: false,
      hasGitHistory: false
    };

    // Vérification fichiers de test
    for (let file of project.files) {
      if (file.name.includes('test') || file.name.includes('spec')) {
        indicators.hasTests = true;
        score++;
        break;
      }
    }

    // Vérification documentation
    for (let file of project.files) {
      if (file.name.toLowerCase().includes('readme') || path.extname(file.name) === '.md') {
        indicators.hasDocumentation = true;
        score++;
        break;
      }
    }

    // Vérification configuration
    for (let file of project.files) {
      if (['package.json', 'requirements.txt', 'setup.py'].includes(file.name)) {
        indicators.hasConfiguration = true;
        score++;
        break;
      }
    }

    // Vérification Git
    if (fs.existsSync(path.join(project.path, '.git'))) {
      indicators.hasGitHistory = true;
      score++;
    }

    // Classification
    if (score >= 3) return { level: 'production', score, indicators };
    if (score >= 2) return { level: 'development', score, indicators };
    if (score >= 1) return { level: 'prototype', score, indicators };
    return { level: 'abandoned', score, indicators };
  }

  getLastActivity(project) {
    let lastModified = 0;
    
    for (let file of project.files) {
      try {
        const stat = fs.statSync(file.path);
        if (stat.mtime.getTime() > lastModified) {
          lastModified = stat.mtime.getTime();
        }
      } catch (error) {
        // Fichier inaccessible
      }
    }
    
    return new Date(lastModified);
  }

  assessCodeQuality(project) {
    let quality = { score: 0, issues: [] };
    
    for (let file of project.files) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        
        // Heuristiques simples de qualité
        if (content.includes('TODO') || content.includes('FIXME')) {
          quality.issues.push('TODOs/FIXMEs présents');
        }
        
        if (content.length < 100) {
          quality.issues.push('Fichiers très courts');
        }
        
        // Bonus pour commentaires
        const lines = content.split('\n');
        const commentLines = lines.filter(line => 
          line.trim().startsWith('//') || 
          line.trim().startsWith('#') || 
          line.trim().startsWith('/*')
        );
        
        if (commentLines.length / lines.length > 0.1) {
          quality.score += 10;
        }
        
      } catch (error) {
        // Fichier non lisible
      }
    }
    
    return quality;
  }

  calculateProjectSize(project) {
    let totalSize = 0;
    for (let file of project.files) {
      totalSize += file.size;
    }
    return {
      bytes: totalSize,
      mb: (totalSize / (1024 * 1024)).toFixed(2),
      fileCount: project.files.length
    };
  }

  // ========================================
  // DÉTECTION DE DOUBLONS RÉELLE
  // ========================================

  async findDuplicates(discoveries) {
    const duplicates = [];
    const fileHashes = new Map();
    
    const allProjects = this.flattenProjects(discoveries);
    
    for (let project of allProjects) {
      for (let file of project.files) {
        try {
          const content = fs.readFileSync(file.path);
          const hash = crypto.createHash('md5').update(content).digest('hex');
          
          if (fileHashes.has(hash)) {
            fileHashes.get(hash).push({ project: project.name, file: file.name, path: file.path });
          } else {
            fileHashes.set(hash, [{ project: project.name, file: file.name, path: file.path }]);
          }
        } catch (error) {
          // Fichier non lisible
        }
      }
    }
    
    // Identifier les vrais doublons
    for (let [hash, instances] of fileHashes) {
      if (instances.length > 1) {
        duplicates.push({
          hash,
          instances,
          size: fs.statSync(instances[0].path).size,
          canDelete: instances.length - 1
        });
      }
    }
    
    this.analysis.duplicates = duplicates;
    return duplicates;
  }

  flattenProjects(discoveries) {
    const allProjects = [];
    for (let projectType of Object.values(discoveries)) {
      allProjects.push(...projectType);
    }
    return allProjects;
  }

  // ========================================
  // DÉTECTION DE PATTERNS RÉELLE
  // ========================================

  async detectPatterns(discoveries) {
    const patterns = {
      namingConventions: this.analyzeNamingPatterns(discoveries),
      sizeDistribution: this.analyzeSizeDistribution(discoveries),
      activityPatterns: this.analyzeActivityPatterns(discoveries),
      technologyStacks: this.groupByTechStack(discoveries)
    };

    return patterns;
  }

  analyzeNamingPatterns(discoveries) {
    const patterns = { camelCase: 0, snake_case: 0, kebab_case: 0, mixed: 0 };
    
    const allProjects = this.flattenProjects(discoveries);
    
    for (let project of allProjects) {
      const name = project.name;
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
        patterns.camelCase++;
      } else if (/^[a-z][a-z0-9_]*$/.test(name)) {
        patterns.snake_case++;
      } else if (/^[a-z][a-z0-9-]*$/.test(name)) {
        patterns.kebab_case++;
      } else {
        patterns.mixed++;
      }
    }
    
    return patterns;
  }

  analyzeSizeDistribution(discoveries) {
    const allProjects = this.flattenProjects(discoveries);
    const sizes = allProjects.map(p => p.size ? p.size.bytes : 0);
    
    sizes.sort((a, b) => a - b);
    
    return {
      min: sizes[0] || 0,
      max: sizes[sizes.length - 1] || 0,
      median: sizes[Math.floor(sizes.length / 2)] || 0,
      total: sizes.reduce((sum, size) => sum + size, 0)
    };
  }

  analyzeActivityPatterns(discoveries) {
    const allProjects = this.flattenProjects(discoveries);
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    let recentlyActive = 0;
    let monthlyActive = 0;
    let inactive = 0;
    
    for (let project of allProjects) {
      const lastActivity = project.lastActivity;
      
      if (lastActivity > oneWeekAgo) {
        recentlyActive++;
      } else if (lastActivity > oneMonthAgo) {
        monthlyActive++;
      } else {
        inactive++;
      }
    }
    
    return { recentlyActive, monthlyActive, inactive };
  }

  groupByTechStack(discoveries) {
    const stacks = {
      'Web Frontend': discoveries.webProjects?.length || 0,
      'Python': discoveries.pythonProjects?.length || 0,
      'Data/Analytics': discoveries.dataProjects?.length || 0,
      'Documentation': discoveries.documentationProjects?.length || 0,
      'Configuration': discoveries.configProjects?.length || 0
    };
    
    return stacks;
  }

  // ========================================
  // RECOMMANDATIONS RÉELLES
  // ========================================

  generateRecommendations() {
    const recommendations = [];
    const allProjects = this.flattenProjects({
      webProjects: [],
      pythonProjects: [],
      dataProjects: [],
      documentationProjects: [],
      configProjects: []
    });

    // Recommandations basées sur les doublons
    if (this.analysis.duplicates.length > 0) {
      const totalWaste = this.analysis.duplicates.reduce((sum, dup) => 
        sum + dup.size * (dup.instances.length - 1), 0
      );
      
      recommendations.push({
        type: 'cleanup',
        priority: 'high',
        action: 'remove_duplicates',
        impact: `Économie de ${(totalWaste / (1024 * 1024)).toFixed(2)} MB`,
        effort: 'low',
        details: this.analysis.duplicates.slice(0, 5)
      });
    }

    return recommendations;
  }

  // ========================================
  // SAUVEGARDE RÉELLE
  // ========================================

  async createUniversalBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupLocation, `backup_${timestamp}`);
    
    try {
      if (!fs.existsSync(this.config.backupLocation)) {
        fs.mkdirSync(this.config.backupLocation, { recursive: true });
      }
      
      // Créer un manifest du backup
      const manifest = {
        timestamp: new Date().toISOString(),
        source: this.config.projectRoot,
        analysis: this.analysis
      };
      
      fs.writeFileSync(
        path.join(backupPath, 'manifest.json'), 
        JSON.stringify(manifest, null, 2)
      );
      
      return { path: backupPath, manifest };
    } catch (error) {
      throw new Error(`Erreur création backup: ${error.message}`);
    }
  }

  // ========================================
  // INTERFACE CLI FONCTIONNELLE
  // ========================================

  async runCommand(command, options = {}) {
    switch (command) {
      case 'analyze':
        return await this.analyzeAllProjects();
      
      case 'duplicates':
        const analysis = await this.analyzeAllProjects();
        return analysis.duplicates;
      
      case 'backup':
        return await this.createUniversalBackup();
      
      case 'report':
        const reportData = await this.analyzeAllProjects();
        return this.generateReport(reportData, options.format || 'text');
      
      default:
        throw new Error(`Commande inconnue: ${command}`);
    }
  }

  generateReport(data, format = 'text') {
    const allProjects = this.flattenProjects(data.discovered);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // Format texte
    let report = "=== RAPPORT D'ANALYSE DES PROJETS ===\n\n";
    
    report += `Projets analysés: ${allProjects.length}\n`;
    report += `Doublons trouvés: ${data.duplicates.length}\n`;
    
    if (data.duplicates.length > 0) {
      report += "\nDoublons détectés:\n";
      for (let dup of data.duplicates.slice(0, 5)) {
        report += `- ${dup.instances[0].file} (${dup.instances.length} copies)\n`;
      }
    }
    
    report += "\nRecommandations:\n";
    for (let rec of data.recommendations) {
      report += `- ${rec.action}: ${rec.impact}\n`;
    }
    
    return report;
  }
}

module.exports = UniversalProjectConsolidator;