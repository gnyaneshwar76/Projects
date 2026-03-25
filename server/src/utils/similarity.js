const natural = require('natural');

/**
 * Tokenizes and cleans text for processing
 */
function preprocessText(text) {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const stopwords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with',
    'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are',
    'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'can',
    'could', 'would', 'should', 'may', 'might', 'must', 'will', 'shall'
  ]);
  
  // Filter stopwords and short tokens
  const filtered = tokens.filter(token => !stopwords.has(token) && token.length > 2);
  return filtered;
}

/**
 * Calculate TF (Term Frequency) for a document
 */
function calculateTF(tokens) {
  const tf = {};
  const totalTokens = tokens.length;
  
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  
  Object.keys(tf).forEach(token => {
    tf[token] = tf[token] / totalTokens;
  });
  
  return tf;
}

/**
 * Calculate IDF (Inverse Document Frequency) across all documents
 */
function calculateIDF(allTokenizedDocs) {
  const idf = {};
  const totalDocs = allTokenizedDocs.length;
  const docFrequency = {};
  
  // Count how many documents contain each token
  allTokenizedDocs.forEach(tokens => {
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach(token => {
      docFrequency[token] = (docFrequency[token] || 0) + 1;
    });
  });
  
  // Calculate IDF for each token
  Object.keys(docFrequency).forEach(token => {
    idf[token] = Math.log(totalDocs / docFrequency[token]);
  });
  
  return idf;
}

/**
 * Convert text to TF-IDF vector
 */
function textToVector(text, allTokenizedDocs) {
  const tokens = preprocessText(text);
  const tf = calculateTF(tokens);
  const idf = calculateIDF(allTokenizedDocs);
  
  const vector = {};
  Object.keys(tf).forEach(token => {
    vector[token] = (tf[token] || 0) * (idf[token] || 0);
  });
  
  return vector;
}

/**
 * Convert vector to sparse array format (more efficient storage)
 */
function vectorToArray(vector) {
  return Object.entries(vector)
    .map(([term, weight]) => ({ term, weight }))
    .filter(item => item.weight > 0);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
  const keys1 = new Set(Object.keys(vec1));
  const keys2 = new Set(Object.keys(vec2));
  const allKeys = new Set([...keys1, ...keys2]);
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  allKeys.forEach(key => {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  });
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Find similar bugs based on TF-IDF vectors
 */
function findSimilarBugs(newBugDescription, existingBugs, topN = 3) {
  if (existingBugs.length === 0) return [];
  
  // Prepare all documents for IDF calculation
  const allDescriptions = [...existingBugs.map(b => b.description), newBugDescription];
  const allTokenizedDocs = allDescriptions.map(preprocessText);
  
  // Get vector for new bug
  const newVector = textToVector(newBugDescription, allTokenizedDocs);
  
  // Calculate similarity with all existing bugs
  const similarities = existingBugs.map((bug, index) => {
    const bugVector = textToVector(bug.description, allTokenizedDocs);
    const similarity = cosineSimilarity(newVector, bugVector);
    return {
      bugId: bug._id,
      title: bug.title,
      similarity: parseFloat(similarity.toFixed(4)),
      index: index,
    };
  });
  
  // Sort by similarity and get top N
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

module.exports = {
  preprocessText,
  calculateTF,
  calculateIDF,
  textToVector,
  vectorToArray,
  cosineSimilarity,
  findSimilarBugs,
};
