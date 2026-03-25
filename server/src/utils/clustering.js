const { textToVector, cosineSimilarity } = require('./similarity');

/**
 * Initialize cluster centers randomly from data points
 */
function initializeCenters(data, k) {
  const indices = new Set();
  const centers = [];
  
  while (indices.size < Math.min(k, data.length)) {
    const randomIdx = Math.floor(Math.random() * data.length);
    indices.add(randomIdx);
  }
  
  indices.forEach(idx => {
    centers.push(JSON.parse(JSON.stringify(data[idx])));
  });
  
  return centers;
}

/**
 * Calculate centroid from cluster members
 */
function calculateCentroid(clusterMembers) {
  if (clusterMembers.length === 0) return {};
  
  const centroid = {};
  const allKeys = new Set();
  
  clusterMembers.forEach(vector => {
    Object.keys(vector).forEach(key => allKeys.add(key));
  });
  
  allKeys.forEach(key => {
    const sum = clusterMembers.reduce((total, vector) => total + (vector[key] || 0), 0);
    centroid[key] = sum / clusterMembers.length;
  });
  
  return centroid;
}

/**
 * Assign each data point to nearest center
 */
function assignToClusters(data, centers) {
  return data.map((point, idx) => {
    let minDistance = Infinity;
    let closestCenterIdx = 0;
    
    centers.forEach((center, centerIdx) => {
      const similarity = cosineSimilarity(point, center);
      const distance = 1 - similarity; // Convert similarity to distance
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCenterIdx = centerIdx;
      }
    });
    
    return {
      pointIdx: idx,
      clusterIdx: closestCenterIdx,
      distance: minDistance,
    };
  });
}

/**
 * K-means clustering algorithm
 */
function kMeansClustering(vectors, k = 3, maxIterations = 20) {
  if (vectors.length === 0) return { clusters: {}, centers: [] };
  if (vectors.length <= k) {
    const clusters = {};
    vectors.forEach((_, idx) => {
      clusters[idx] = idx;
    });
    return { clusters, centers: vectors };
  }
  
  let centers = initializeCenters(vectors, k);
  let assignments = assignToClusters(vectors, centers);
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Group vectors by cluster
    const clusters = {};
    assignments.forEach(assignment => {
      if (!clusters[assignment.clusterIdx]) {
        clusters[assignment.clusterIdx] = [];
      }
      clusters[assignment.clusterIdx].push(vectors[assignment.pointIdx]);
    });
    
    // Calculate new centers
    const newCenters = [];
    for (let i = 0; i < k; i++) {
      if (clusters[i] && clusters[i].length > 0) {
        newCenters.push(calculateCentroid(clusters[i]));
      } else {
        // Keep old center if no points assigned
        newCenters.push(centers[i]);
      }
    }
    
    // Check for convergence
    let hasChanged = false;
    for (let i = 0; i < k; i++) {
      const similarity = cosineSimilarity(centers[i], newCenters[i]);
      if (similarity < 0.999) {
        hasChanged = true;
        break;
      }
    }
    
    centers = newCenters;
    
    if (!hasChanged) {
      break;
    }
    
    assignments = assignToClusters(vectors, centers);
  }
  
  // Final assignment
  const finalClusters = {};
  assignments.forEach(assignment => {
    finalClusters[assignment.pointIdx] = assignment.clusterIdx;
  });
  
  return { clusters: finalClusters, centers };
}

/**
 * Suggest root causes based on bug clusters
 */
function suggestRootCauses(bugs, clustering) {
  const { clusters } = clustering;
  const clusterGroups = {};
  
  // Group bugs by cluster
  bugs.forEach((bug, idx) => {
    const clusterIdx = clusters[idx];
    if (!clusterGroups[clusterIdx]) {
      clusterGroups[clusterIdx] = [];
    }
    clusterGroups[clusterIdx].push(bug);
  });
  
  const rootCauses = {};
  
  // Analyze each cluster
  Object.keys(clusterGroups).forEach(clusterIdx => {
    const clusterBugs = clusterGroups[clusterIdx];
    const allTags = [];
    const allKeywords = [];
    
    clusterBugs.forEach(bug => {
      allTags.push(...(bug.tags || []));
      const words = bug.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      allKeywords.push(...words);
    });
    
    // Find most common tags and keywords
    const tagFrequency = {};
    const keywordFrequency = {};
    
    allTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
    
    allKeywords.forEach(keyword => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });
    
    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
    
    const topKeywords = Object.entries(keywordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);
    
    const suggestion = [
      `Common tags: ${topTags.join(', ') || 'N/A'}`,
      `Related to: ${topKeywords.join(', ') || 'N/A'}`,
      `Affects ${clusterBugs.length} issues`,
    ].join(' | ');
    
    rootCauses[clusterIdx] = suggestion;
  });
  
  return rootCauses;
}

module.exports = {
  kMeansClustering,
  suggestRootCauses,
  initializeCenters,
  calculateCentroid,
  assignToClusters,
};
