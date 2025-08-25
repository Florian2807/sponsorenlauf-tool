const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Sammle alle verwendeten CSS-Klassen aus JS/TS Dateien
function getUsedClasses() {
    const usedClasses = new Set();
    
    // Finde alle JS/TS/JSX/TSX Dateien
    const jsFiles = execSync('find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' }).trim().split('\n');
    
    for (const file of jsFiles) {
        if (!file) continue;
        try {
            const content = fs.readFileSync(file, 'utf8');
            // Finde className="..." Patterns
            const classMatches = content.match(/className\s*=\s*["`']([^"`']*)["`']/g);
            if (classMatches) {
                classMatches.forEach(match => {
                    const classes = match.replace(/className\s*=\s*["`']/, '').replace(/["`']$/, '').trim();
                    classes.split(/\s+/).forEach(cls => {
                        if (cls) usedClasses.add(cls);
                    });
                });
            }
            
            // Finde auch template literals mit classes
            const templateMatches = content.match(/className\s*=\s*`[^`]*`/g);
            if (templateMatches) {
                templateMatches.forEach(match => {
                    const classes = match.replace(/className\s*=\s*`/, '').replace(/`$/, '').trim();
                    // Extrahiere nur die statischen Teile (ohne ${...})
                    const staticParts = classes.split(/\$\{[^}]*\}/);
                    staticParts.forEach(part => {
                        part.split(/\s+/).forEach(cls => {
                            if (cls) usedClasses.add(cls);
                        });
                    });
                });
            }
        } catch (e) {
            console.log(`Fehler beim Lesen von ${file}:`, e.message);
        }
    }
    
    return Array.from(usedClasses);
}

// Sammle alle definierten CSS-Klassen aus globals.css
function getDefinedClasses() {
    const definedClasses = new Set();
    
    try {
        const cssContent = fs.readFileSync('src/styles/globals.css', 'utf8');
        
        // Finde CSS-Klassen-Selektoren
        const classMatches = cssContent.match(/\.[a-zA-Z0-9_-]+(?:[^{]*)?{/g);
        if (classMatches) {
            classMatches.forEach(match => {
                // Entferne { und extrahiere Klassennamen
                const selector = match.replace(/{.*$/, '').trim();
                
                // Handle multiple selectors separated by commas
                const selectors = selector.split(',');
                selectors.forEach(sel => {
                    sel = sel.trim();
                    // Extrahiere nur einfache Klassennamen (beginnen mit .)
                    if (sel.startsWith('.')) {
                        const className = sel.substring(1).split(/[\s:>+~\[]/)[0];
                        if (className) {
                            definedClasses.add(className);
                        }
                    }
                });
            });
        }
    } catch (e) {
        console.log('Fehler beim Lesen der CSS-Datei:', e.message);
    }
    
    return Array.from(definedClasses);
}

// Hauptfunktion
function findUnusedClasses() {
    console.log('Sammle verwendete CSS-Klassen...');
    const usedClasses = getUsedClasses();
    
    console.log('Sammle definierte CSS-Klassen...');
    const definedClasses = getDefinedClasses();
    
    console.log(`\nGefunden: ${usedClasses.length} verwendete Klassen, ${definedClasses.length} definierte Klassen\n`);
    
    // Finde nicht verwendete Klassen
    const unusedClasses = definedClasses.filter(className => !usedClasses.includes(className));
    
    console.log('Nicht verwendete CSS-Klassen:');
    console.log('================================');
    
    if (unusedClasses.length === 0) {
        console.log('Alle CSS-Klassen werden verwendet!');
    } else {
        unusedClasses.sort().forEach(className => {
            console.log(`- ${className}`);
        });
        
        console.log(`\n${unusedClasses.length} nicht verwendete Klassen gefunden.`);
    }
    
    // Zeige auch einige verwendete Klassen zur Validierung
    console.log('\nEinige verwendete Klassen (zur Validierung):');
    console.log('============================================');
    usedClasses.slice(0, 20).sort().forEach(className => {
        console.log(`+ ${className}`);
    });
}

findUnusedClasses();
