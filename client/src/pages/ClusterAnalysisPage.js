import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bugAPI } from '../utils/api';
import '../App.css';

function ClusterAnalysisPage({ isDark = false }) {
  const [clusters, setClusters] = useState(null);
  const [numClusters, setNumClusters] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClusteringAnalysis();
  }, [numClusters]);

  const fetchClusteringAnalysis = async () => {
    try {
      setLoading(true);
      const response = await bugAPI.getClusteringAnalysis(numClusters);
      setClusters(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching clustering analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNumClustersChange = (e) => {
    setNumClusters(parseInt(e.target.value));
  };

  return (
    <div className="container">
      <h1 className="section-title">📊 Bug Clustering & Root Cause Analysis</h1>

      {/* Controls */}
      <div className="card mb-8 p-6 max-w-md">
        <label className="form-label">Number of Clusters</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="2"
            max="10"
            value={numClusters}
            onChange={handleNumClustersChange}
            className="flex-1"
          />
          <input
            type="number"
            min="2"
            max="10"
            value={numClusters}
            onChange={handleNumClustersChange}
            className="form-input w-20"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Performing clustering analysis...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : !clusters ? (
        <div className="card text-center py-12 text-gray-500">
          No clustering data available. Please create some bugs first.
        </div>
      ) : clusters.totalBugs < 2 ? (
        <div className="card text-center py-12">
          <div className="text-gray-500 text-lg mb-4">Not enough bugs for clustering analysis</div>
          <p className="text-gray-600 mb-4">You need at least 2 bugs to perform cluster analysis.</p>
          <Link to="/bugs/create" className="btn-primary btn-base">
            Report First Bug
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid-3 mb-8">
            <div className="card p-6">
              <div className="text-3xl font-bold text-blue-600">{clusters.totalBugs}</div>
              <div className="text-gray-600 text-sm mt-2">Total Bugs Analyzed</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-purple-600">{clusters.numClusters}</div>
              <div className="text-gray-600 text-sm mt-2">Clusters Identified</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(clusters.totalBugs / clusters.numClusters)}
              </div>
              <div className="text-gray-600 text-sm mt-2">Avg Bugs per Cluster</div>
            </div>
          </div>

          {/* Clusters */}
          <div className="space-y-6">
            {Object.entries(clusters.clusters || {}).map(([clusterIdx, clusterData]) => (
              <div key={clusterIdx} className="card p-6">
                {/* Cluster Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                      {clusterData.clusterIndex + 1}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Cluster {clusterData.clusterIndex + 1}
                    </h2>
                    <div className="ml-auto text-right">
                      <div className="text-sm text-gray-600">
                        {clusterData.bugs.length} issue{clusterData.bugs.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Root Cause Suggestion */}
                  {clusterData.rootCauseSuggestion && (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <div className="font-semibold text-gray-800 mb-1">💡 Root Cause Suggestion:</div>
                      <div className="text-gray-700 text-sm">
                        {clusterData.rootCauseSuggestion}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bugs in Cluster */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                    Related Issues
                  </h3>
                  {clusterData.bugs.map(bug => (
                    <Link
                      key={bug._id}
                      to={`/bugs/${bug._id}`}
                      className="flex items-start justify-between p-3 border border-gray-200 rounded hover:border-blue-400 hover:bg-blue-50 transition"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 hover:text-blue-600">
                          {bug.title}
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {bug.tags && bug.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4 text-right">
                        <span className={`badge badge-${bug.severity}`}>
                          {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                        </span>
                        <span className={`badge badge-${bug.status?.replace(' ', '-')}`}>
                          {bug.status?.charAt(0).toUpperCase() + bug.status?.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Cluster Statistics */}
                <div className="mt-6 pt-4 border-t border-gray-200 grid-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Critical Issues:</span>
                    <span className="ml-2 font-bold text-red-600">
                      {clusterData.bugs.filter(b => b.severity === 'critical').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Open Issues:</span>
                    <span className="ml-2 font-bold text-red-600">
                      {clusterData.bugs.filter(b => b.status === 'open').length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Analysis Overview */}
          <div className="card p-6 mt-8 bg-blue-50 border-blue-200">
            <h2 className="text-lg font-bold text-gray-800 mb-3">📈 Analysis Insights</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ Similar bugs have been grouped together for pattern analysis</li>
              <li>✓ Common keywords and tags within clusters suggest root causes</li>
              <li>✓ Focus remediation efforts on clusters with the most issues</li>
              <li>✓ Adjust the number of clusters to refine the grouping</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default ClusterAnalysisPage;
