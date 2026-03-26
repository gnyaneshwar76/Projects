const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.gemini')) {
        results = results.concat(walk(file));
      }
    } else {
      results.push(file);
    }
  });
  return results;
};

const files = walk('e:/BR');
let changedCount = 0;

files.forEach(file => {
  try {
    if (file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.includes('.system_generated')) return;
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
      .replace(/BugRadar/g, 'TraceStack')
      .replace(/bugradar/g, 'tracestack')
      .replace(/BUGRADAR/g, 'TRACESTACK');
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      changedCount++;
      console.log('Updated:', file);
    }
  } catch (e) {
    // skip
  }
});

console.log('Total files changed:', changedCount);
