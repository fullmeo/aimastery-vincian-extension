import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectNode {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'function' | 'class';
    extension?: string;
    size: number;
    dependencies: number;
    complexity?: number;
}

export interface DependencyLink {
    source: string;
    target: string;
    type: 'import' | 'call' | 'extends' | 'implements';
    strength: number;
}

export interface ProjectGraphData {
    nodes: ProjectNode[];
    links: DependencyLink[];
    stats: {
        totalFiles: number;
        totalConnections: number;
        avgComplexity: number;
        circularDependencies: string[];
    };
}

export class ConnectionCanvas {
    private fileExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.php'];
    
    constructor(private context: vscode.ExtensionContext) {}
    
    async analyzeProjectConnections(): Promise<ProjectGraphData> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('Aucun workspace ouvert');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const files = await this.getAllProjectFiles(rootPath);
        
        const nodes: ProjectNode[] = [];
        const links: DependencyLink[] = [];
        const dependencyMap = new Map<string, string[]>();

        // Analyser chaque fichier
        for (const filePath of files) {
            const fileContent = await this.readFileContent(filePath);
            const node = await this.createNodeFromFile(filePath, fileContent);
            nodes.push(node);

            // Analyser les dépendances
            const dependencies = this.extractDependencies(fileContent, filePath);
            dependencyMap.set(filePath, dependencies);

            // Créer les liens
            for (const dep of dependencies) {
                const targetPath = this.resolveDependencyPath(dep, filePath, files);
                if (targetPath) {
                    links.push({
                        source: filePath,
                        target: targetPath,
                        type: this.getDependencyType(dep),
                        strength: this.calculateLinkStrength(fileContent, dep)
                    });
                }
            }
        }

        // Calculer les statistiques
        const stats = this.calculateStats(nodes, links, dependencyMap);

        return { nodes, links, stats };
    }

    private async getAllProjectFiles(rootPath: string): Promise<string[]> {
        const files: string[] = [];
        
        const scanDirectory = async (dirPath: string) => {
            try {
                const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    
                    if (entry.isDirectory()) {
                        // Ignorer certains dossiers
                        if (!['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
                            await scanDirectory(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (this.fileExtensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Erreur lors de la lecture du dossier ${dirPath}:`, error);
            }
        };

        await scanDirectory(rootPath);
        return files;
    }

    private async readFileContent(filePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        } catch {
            return '';
        }
    }

    private async createNodeFromFile(filePath: string, content: string): Promise<ProjectNode> {
        const fileName = path.basename(filePath);
        const extension = path.extname(fileName).slice(1);
        
        return {
            id: filePath,
            name: fileName,
            path: filePath,
            type: 'file',
            extension,
            size: content.length,
            dependencies: this.extractDependencies(content, filePath).length,
            complexity: this.calculateFileComplexity(content)
        };
    }

    private extractDependencies(content: string, filePath: string): string[] {
        const dependencies: string[] = [];
        
        // Expressions régulières pour différents types d'imports
        const patterns = [
            // ES6/TypeScript imports
            /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
            /import\s+['"]([^'"]+)['"]/g,
            // CommonJS require
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            // Dynamic imports
            /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            // Python imports (commenté car peut créer des faux positifs)
            // /from\s+([^\s]+)\s+import/g,
            // /import\s+([^\s;]+)/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const dep = match[1];
                // CORRECTION: Inclure aussi les dépendances relatives qui commencent par '.'
                if (dep && !dependencies.includes(dep)) {
                    dependencies.push(dep);
                }
            }
        }

        return dependencies;
    }

    private resolveDependencyPath(dependency: string, fromFile: string, allFiles: string[]): string | null {
        const fromDir = path.dirname(fromFile);
        
        // Essayer de résoudre les imports relatifs
        if (dependency.startsWith('.')) {
            const resolved = path.resolve(fromDir, dependency);
            
            // Chercher avec différentes extensions
            for (const ext of this.fileExtensions) {
                const withExt = resolved + ext;
                if (allFiles.includes(withExt)) {
                    return withExt;
                }
            }
            
            // Chercher index files
            for (const ext of this.fileExtensions) {
                const indexFile = path.join(resolved, `index${ext}`);
                if (allFiles.includes(indexFile)) {
                    return indexFile;
                }
            }
        }

        // Pour les modules externes, chercher dans les fichiers du projet
        const possibleMatches = allFiles.filter(file => 
            path.basename(file, path.extname(file)) === dependency ||
            file.includes(dependency)
        );

        return possibleMatches[0] || null;
    }

    private getDependencyType(dependency: string): 'import' | 'call' | 'extends' | 'implements' {
        // Logique simplifiée pour déterminer le type de dépendance
        if (dependency.includes('extends') || dependency.includes('inherit')) {
            return 'extends';
        }
        if (dependency.includes('implements') || dependency.includes('interface')) {
            return 'implements';
        }
        if (dependency.includes('()') || dependency.includes('call')) {
            return 'call';
        }
        return 'import';
    }

    private calculateLinkStrength(content: string, dependency: string): number {
        // Compter les occurrences de la dépendance dans le fichier
        const regex = new RegExp(dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex) || [];
        return Math.min(matches.length, 10); // Max 10 pour la visualisation
    }

    private calculateFileComplexity(content: string): number {
        let complexity = 1; // Complexité de base
        
        // Compter les structures de contrôle
        const patterns = [
            /\bif\s*\(/g,
            /\belse\s+if\s*\(/g,
            /\bwhile\s*\(/g,
            /\bfor\s*\(/g,
            /\bdo\s*\{/g,
            /\bswitch\s*\(/g,
            /\bcase\s+/g,
            /\bcatch\s*\(/g,
            /\?\s*.*?\s*:/g, // Opérateur ternaire
            /&&|\|\|/g // Opérateurs logiques
        ];

        for (const pattern of patterns) {
            const matches = content.match(pattern) || [];
            complexity += matches.length;
        }

        return complexity;
    }

    private calculateStats(nodes: ProjectNode[], links: DependencyLink[], dependencyMap: Map<string, string[]>) {
        const totalFiles = nodes.length;
        const totalConnections = links.length;
        const avgComplexity = nodes.reduce((sum, node) => sum + (node.complexity || 0), 0) / totalFiles;
        
        // Détecter les dépendances circulaires (algorithme simple)
        const circularDependencies = this.detectCircularDependencies(dependencyMap);

        return {
            totalFiles,
            totalConnections,
            avgComplexity: Math.round(avgComplexity * 100) / 100,
            circularDependencies
        };
    }

    private detectCircularDependencies(dependencyMap: Map<string, string[]>): string[] {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const cycles: string[] = [];

        const dfs = (node: string, path: string[]): boolean => {
            if (recursionStack.has(node)) {
                cycles.push(`Cycle: ${path.join(' → ')} → ${node}`);
                return true;
            }

            if (visited.has(node)) {
                return false;
            }

            visited.add(node);
            recursionStack.add(node);

            const dependencies = dependencyMap.get(node) || [];
            for (const dep of dependencies) {
                if (dfs(dep, [...path, node])) {
                    return true;
                }
            }

            recursionStack.delete(node);
            return false;
        };

        for (const [node] of dependencyMap) {
            if (!visited.has(node)) {
                dfs(node, []);
            }
        }

        return cycles;
    }

    getConnectionCanvasHtml(graphData: ProjectGraphData): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Toile de Connexions Vincienne</title>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <style>
                body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1e1e1e; color: #fff; overflow: hidden; }
                .controls { position: absolute; top: 10px; left: 10px; z-index: 1000; }
                .control-group { margin-bottom: 10px; }
                button { background: #0078d4; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; }
                button:hover { background: #106ebe; }
                select { background: #2d2d30; color: white; border: 1px solid #464647; padding: 6px; border-radius: 4px; }
                .stats { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 8px; }
                .node-details { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 8px; max-width: 300px; }
                .legend { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 8px; }
                #graph { width: 100vw; height: 100vh; }
                .tooltip { position: absolute; background: rgba(0,0,0,0.9); color: white; padding: 10px; border-radius: 4px; pointer-events: none; font-size: 12px; z-index: 1001; }
            </style>
        </head>
        <body>
            <div class="controls">
                <div class="control-group">
                    <button onclick="resetZoom()">🔍 Reset Zoom</button>
                    <button onclick="toggleMode()">🔄 Mode Vue</button>
                    <button onclick="analyzeConnections()">⚡ Analyser</button>
                </div>
                <div class="control-group">
                    <select id="filterType" onchange="filterNodes()">
                        <option value="all">Tous les fichiers</option>
                        <option value="js">JavaScript</option>
                        <option value="ts">TypeScript</option>
                        <option value="py">Python</option>
                        <option value="java">Java</option>
                    </select>
                </div>
            </div>

            <div class="stats">
                <h3>📊 Statistiques</h3>
                <p><strong>Fichiers:</strong> ${graphData.stats.totalFiles}</p>
                <p><strong>Connexions:</strong> ${graphData.stats.totalConnections}</p>
                <p><strong>Complexité moy.:</strong> ${graphData.stats.avgComplexity}</p>
                <p><strong>Cycles:</strong> ${graphData.stats.circularDependencies.length}</p>
            </div>

            <div class="node-details" id="nodeDetails" style="display: none;">
                <h3>📁 Détails du nœud</h3>
                <div id="nodeInfo"></div>
                <button onclick="openFile()" id="openFileBtn" style="margin-top: 10px;">Ouvrir</button>
                <button onclick="analyzeFile()" id="analyzeFileBtn" style="margin-top: 10px;">Analyser</button>
            </div>

            <div class="legend">
                <h4>🎨 Légende</h4>
                <div><span style="color: #FFD700;">●</span> JavaScript</div>
                <div><span style="color: #3178C6;">●</span> TypeScript</div>
                <div><span style="color: #3776AB;">●</span> Python</div>
                <div><span style="color: #007396;">●</span> Java</div>
                <div><span style="color: #888;">●</span> Autres</div>
            </div>

            <svg id="graph"></svg>
            <div class="tooltip" id="tooltip" style="display: none;"></div>

            <script>
                const vscode = acquireVsCodeApi();
                let graphData = ${JSON.stringify(graphData)};
                let currentMode = 'force';
                let selectedNode = null;
                
                const colorMap = {
                    'js': '#FFD700',
                    'jsx': '#FFD700',
                    'ts': '#3178C6', 
                    'tsx': '#3178C6',
                    'py': '#3776AB',
                    'java': '#007396',
                    'cs': '#512BD4',
                    'php': '#777BB4'
                };

                const svg = d3.select("#graph");
                const width = window.innerWidth;
                const height = window.innerHeight;
                
                svg.attr("width", width).attr("height", height);
                
                const g = svg.append("g");
                
                // Zoom behavior
                const zoom = d3.zoom()
                    .scaleExtent([0.1, 10])
                    .on("zoom", (event) => {
                        g.attr("transform", event.transform);
                    });
                
                svg.call(zoom);
                
                // Force simulation
                const simulation = d3.forceSimulation(graphData.nodes)
                    .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .force("center", d3.forceCenter(width / 2, height / 2));

                function renderGraph() {
                    g.selectAll("*").remove();
                    
                    // Links
                    const link = g.append("g")
                        .selectAll("line")
                        .data(graphData.links)
                        .enter().append("line")
                        .attr("stroke", "#999")
                        .attr("stroke-opacity", 0.6)
                        .attr("stroke-width", d => Math.sqrt(d.strength));

                    // Nodes
                    const node = g.append("g")
                        .selectAll("circle")
                        .data(graphData.nodes)
                        .enter().append("circle")
                        .attr("r", d => Math.max(5, Math.sqrt(d.size / 100)))
                        .attr("fill", d => colorMap[d.extension] || '#888')
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 1.5)
                        .on("click", (event, d) => {
                            selectedNode = d;
                            showNodeDetails(d);
                        })
                        .on("mouseover", (event, d) => {
                            showTooltip(event, d);
                        })
                        .on("mouseout", hideTooltip)
                        .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended));

                    // Labels
                    const labels = g.append("g")
                        .selectAll("text")
                        .data(graphData.nodes)
                        .enter().append("text")
                        .text(d => d.name)
                        .attr("font-size", "10px")
                        .attr("fill", "white")
                        .attr("text-anchor", "middle");

                    simulation.on("tick", () => {
                        link
                            .attr("x1", d => d.source.x)
                            .attr("y1", d => d.source.y)
                            .attr("x2", d => d.target.x)
                            .attr("y2", d => d.target.y);

                        node
                            .attr("cx", d => d.x)
                            .attr("cy", d => d.y);
                            
                        labels
                            .attr("x", d => d.x)
                            .attr("y", d => d.y + 3);
                    });
                }

                function showNodeDetails(node) {
                    const details = document.getElementById('nodeDetails');
                    const info = document.getElementById('nodeInfo');
                    
                    info.innerHTML = \`
                        <p><strong>Nom:</strong> \${node.name}</p>
                        <p><strong>Type:</strong> \${node.extension || 'N/A'}</p>
                        <p><strong>Taille:</strong> \${node.size} chars</p>
                        <p><strong>Complexité:</strong> \${node.complexity || 'N/A'}</p>
                        <p><strong>Dépendances:</strong> \${node.dependencies}</p>
                    \`;
                    
                    details.style.display = 'block';
                }

                function showTooltip(event, node) {
                    const tooltip = document.getElementById('tooltip');
                    tooltip.innerHTML = \`\${node.name}<br/>Complexité: \${node.complexity}\`;
                    tooltip.style.display = 'block';
                    tooltip.style.left = (event.pageX + 10) + 'px';
                    tooltip.style.top = (event.pageY - 10) + 'px';
                }

                function hideTooltip() {
                    document.getElementById('tooltip').style.display = 'none';
                }

                function resetZoom() {
                    svg.transition().duration(750).call(
                        zoom.transform,
                        d3.zoomIdentity
                    );
                }

                function toggleMode() {
                    currentMode = currentMode === 'force' ? 'hierarchy' : 'force';
                    if (currentMode === 'hierarchy') {
                        // Implémentation d'une vue hiérarchique simple
                        simulation.stop();
                        renderHierarchy();
                    } else {
                        renderGraph();
                    }
                }

                function renderHierarchy() {
                    // Vue hiérarchique simplifiée
                    g.selectAll("*").remove();
                    
                    const hierarchy = d3.hierarchy({
                        children: graphData.nodes.map(node => ({ ...node, children: [] }))
                    });
                    
                    const treeLayout = d3.tree().size([width - 100, height - 100]);
                    treeLayout(hierarchy);
                    
                    // Render hierarchy nodes and links
                    // (Implémentation simplifiée)
                }

                function filterNodes() {
                    const filterType = document.getElementById('filterType').value;
                    // Filtrer les nœuds selon le type sélectionné
                    // (Implémentation complète nécessaire)
                }

                function analyzeConnections() {
                    vscode.postMessage({
                        command: 'analyze-connections'
                    });
                }

                function openFile() {
                    if (selectedNode) {
                        vscode.postMessage({
                            command: 'open-file',
                            path: selectedNode.path
                        });
                    }
                }

                function analyzeFile() {
                    if (selectedNode) {
                        vscode.postMessage({
                            command: 'analyze-file',
                            path: selectedNode.path
                        });
                    }
                }

                function dragstarted(event, d) {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function dragged(event, d) {
                    d.fx = event.x;
                    d.fy = event.y;
                }

                function dragended(event, d) {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }

                // Initialiser le graphique
                renderGraph();
            </script>
        </body>
        </html>
        `;
    }
}