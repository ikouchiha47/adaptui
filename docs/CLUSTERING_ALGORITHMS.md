# Clustering Algorithms for Geographical Grouping

## Current Implementation: K-Means

**Location:** `src/services/TravelService.ts` → `clusterPlacesByProximity()`

### How K-Means Works

K-means is a **centroid-based** clustering algorithm:

1. **Initialize:** Pick K random points as cluster centers
2. **Assign:** Each place goes to nearest center
3. **Update:** Recalculate centers as average of assigned places
4. **Repeat:** Steps 2-3 until centers stabilize (5 iterations)

```typescript
// Current implementation
private clusterPlacesByProximity(places: any[], targetClusters: number) {
  // Initialize k centers
  let centers = places.slice(0, k).map(p => ({
    lat: p.location.latitude,
    lng: p.location.longitude,
  }));
  
  // Iterate 5 times
  for (let iter = 0; iter < 5; iter++) {
    // Assign to nearest center
    // Recalculate centers
  }
}
```

### Pros of K-Means
✅ **Fast:** O(n·k·i) where i = iterations (usually 5)
✅ **Simple:** Easy to understand and implement
✅ **Predictable:** Always produces K clusters
✅ **Works well:** When clusters are roughly spherical and similar size

### Cons of K-Means
❌ **Must specify K:** Need to know cluster count in advance
❌ **Sensitive to outliers:** One far place can skew entire cluster
❌ **Assumes spherical:** Doesn't handle irregular shapes well
❌ **Equal size bias:** Tends to create similar-sized clusters

---

## Alternative: DBSCAN (Density-Based Spatial Clustering)

**DBSCAN** = Density-Based Spatial Clustering of Applications with Noise

### How DBSCAN Works

DBSCAN is a **density-based** algorithm that finds clusters based on point density:

1. **Core Points:** Points with ≥ minPts neighbors within ε distance
2. **Border Points:** Within ε of a core point, but not core themselves
3. **Noise:** Points that aren't core or border (outliers)
4. **Clusters:** Connected components of core points

```
Parameters:
- ε (epsilon): Maximum distance between two points to be neighbors
- minPts: Minimum points to form a dense region

Example with ε=500m, minPts=3:

    A ●─────● B          ● X (noise - isolated)
      │     │
      ● C   ● D
      
Cluster 1: {A, B, C, D} - all within 500m of each other
Noise: {X} - too far from others
```

### Pros of DBSCAN
✅ **No K needed:** Automatically finds number of clusters
✅ **Handles noise:** Identifies outliers as noise
✅ **Arbitrary shapes:** Can find non-spherical clusters
✅ **Density-based:** Groups by actual geographical density

### Cons of DBSCAN
❌ **Parameter tuning:** Need to choose ε and minPts
❌ **Varying density:** Struggles with clusters of different densities
❌ **Slower:** O(n²) without spatial index, O(n log n) with R-tree
❌ **Border ambiguity:** Border points can belong to multiple clusters

---

## Comparison for Travel Recommendations

| Aspect | K-Means | DBSCAN |
|--------|---------|--------|
| **Cluster count** | Fixed (must specify) | Automatic |
| **Outlier handling** | Forces into clusters | Marks as noise |
| **Shape flexibility** | Spherical only | Any shape |
| **Speed** | Fast (5 iterations) | Slower (distance matrix) |
| **Use case** | Even distribution | Varying density |

### Example: Bangkok Places

**K-Means Result:**
```
Cluster 1: Sukhumvit (5 places)
Cluster 2: Old Town (5 places)
Cluster 3: Riverside (4 places)
```
→ Forces equal distribution

**DBSCAN Result:**
```
Cluster 1: Sukhumvit (8 places) - high density
Cluster 2: Old Town (3 places) - medium density
Noise: 3 isolated places
```
→ Reflects actual density

---

## When to Use Each

### Use K-Means When:
- You want a specific number of recommendations (e.g., "show 3 areas")
- Places are evenly distributed
- Speed is critical
- You want predictable output

### Use DBSCAN When:
- You want to discover natural groupings
- Some places are isolated (should be separate)
- Density varies significantly (downtown vs suburbs)
- You want to filter out outliers

---

## Implementation: DBSCAN for Travel

Here's how to implement DBSCAN for geographical clustering:

```typescript
interface DBSCANCluster {
  places: any[];
  center: { lat: number; lng: number };
  density: number; // places per km²
}

function clusterWithDBSCAN(
  places: any[],
  epsilon: number = 1.0, // 1km radius
  minPts: number = 3      // minimum 3 places
): DBSCANCluster[] {
  const visited = new Set<number>();
  const clusters: DBSCANCluster[] = [];
  const noise: any[] = [];

  // Helper: Get neighbors within epsilon
  function getNeighbors(placeIdx: number): number[] {
    const neighbors: number[] = [];
    const place = places[placeIdx];
    
    for (let i = 0; i < places.length; i++) {
      if (i === placeIdx) continue;
      
      const dist = getDistance(
        place.location.latitude,
        place.location.longitude,
        places[i].location.latitude,
        places[i].location.longitude
      );
      
      if (dist <= epsilon) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }

  // Helper: Expand cluster from core point
  function expandCluster(placeIdx: number, neighbors: number[]): any[] {
    const cluster = [places[placeIdx]];
    visited.add(placeIdx);
    
    const queue = [...neighbors];
    
    while (queue.length > 0) {
      const currentIdx = queue.shift()!;
      
      if (visited.has(currentIdx)) continue;
      visited.add(currentIdx);
      
      cluster.push(places[currentIdx]);
      
      const currentNeighbors = getNeighbors(currentIdx);
      
      // If core point, add its neighbors to queue
      if (currentNeighbors.length >= minPts) {
        queue.push(...currentNeighbors);
      }
    }
    
    return cluster;
  }

  // Main DBSCAN loop
  for (let i = 0; i < places.length; i++) {
    if (visited.has(i)) continue;
    
    const neighbors = getNeighbors(i);
    
    if (neighbors.length < minPts) {
      // Noise point
      noise.push(places[i]);
      visited.add(i);
    } else {
      // Core point - expand cluster
      const cluster = expandCluster(i, neighbors);
      
      // Calculate cluster center
      const avgLat = cluster.reduce((sum, p) => sum + p.location.latitude, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, p) => sum + p.location.longitude, 0) / cluster.length;
      
      // Calculate density (places per km²)
      const area = Math.PI * epsilon * epsilon; // circular area
      const density = cluster.length / area;
      
      clusters.push({
        places: cluster,
        center: { lat: avgLat, lng: avgLng },
        density
      });
    }
  }

  // Sort clusters by density (highest first)
  clusters.sort((a, b) => b.density - a.density);

  console.log(`📍 [DBSCAN] Found ${clusters.length} clusters, ${noise.length} noise points`);
  
  return clusters;
}
```

---

## Hybrid Approach: Best of Both

For travel recommendations, a **hybrid approach** works best:

```typescript
function smartCluster(places: any[]): Cluster[] {
  // Step 1: Use DBSCAN to find natural groupings
  const dbscanClusters = clusterWithDBSCAN(places, 1.0, 3);
  
  // Step 2: If too many clusters, merge nearby ones using K-means
  if (dbscanClusters.length > 5) {
    return kMeansOnClusters(dbscanClusters, 5);
  }
  
  // Step 3: If too few clusters, split large ones
  if (dbscanClusters.length < 3) {
    return splitLargeClusters(dbscanClusters, 3);
  }
  
  return dbscanClusters;
}
```

### Benefits:
✅ Discovers natural groupings (DBSCAN)
✅ Ensures reasonable cluster count (K-means)
✅ Handles outliers (DBSCAN noise detection)
✅ Fast enough for real-time (hybrid optimization)

---

## Recommendation

For the travel app, I recommend:

1. **Keep K-means for now** - It's working well and is fast
2. **Add DBSCAN as an option** - For "discover mode" where users want natural groupings
3. **Use hybrid for advanced mode** - Best of both worlds

The current K-means implementation is **perfectly fine** for geographical clustering. DBSCAN would be an enhancement, not a fix.
