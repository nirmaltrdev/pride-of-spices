import { AssetDefinition, AssetCategory, Assets } from './AssetManifest';

class AssetLoaderService {
  private cache = new Map<string, Promise<void>>();
  private loaded = new Set<string>();
  private errors = new Set<string>();
  private abortControllers = new Map<string, AbortController>();

  /**
   * Preloads a single asset. Uses an AbortController to support cancellation.
   */
  public preloadAsset(asset: AssetDefinition): Promise<void> {
    if (this.loaded.has(asset.id)) {
      return Promise.resolve();
    }

    if (this.cache.has(asset.id)) {
      return this.cache.get(asset.id)!;
    }

    const controller = new AbortController();
    this.abortControllers.set(asset.id, controller);

    const loadPromise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loaded.add(asset.id);
        this.cache.delete(asset.id);
        this.abortControllers.delete(asset.id);
        resolve();
      };
      
      img.onerror = () => {
        this.errors.add(asset.id);
        this.cache.delete(asset.id);
        this.abortControllers.delete(asset.id);
        
        console.error(`[AssetLoader] Failed to load asset: ${asset.id}`);
        console.error(`[AssetLoader] Requested URL: ${img.src}`);
        console.error(`[AssetLoader] Document Origin: ${window.location.origin}`);
        console.error(`[AssetLoader] crossOrigin Attribute: ${img.crossOrigin}`);

        reject(new Error(`Failed to load asset: ${asset.id}`));
      };

      // Set crossOrigin if we ever load from external CDNs
      img.crossOrigin = 'anonymous';

      controller.signal.addEventListener('abort', () => {
        img.src = ''; // Cancel the load
        reject(new Error('Aborted'));
      });

      // Prefer WebP or AVIF if browser supports it, but since we are just preloading into browser cache,
      // loading the raw source or the best fallback is typical. For actual render, <picture> is used.
      // We will preload the best optimized source we assume is supported, but to be safe without sniffing,
      // preloading the primary source ensures the fallback is ready.
      img.src = asset.source; 
    });

    // We trap the error internally so Promise.all doesn't fail completely on one bad asset
    const safePromise = loadPromise.catch((err) => {
      console.warn(`[AssetLoader] ${err.message}`);
    });

    this.cache.set(asset.id, safePromise);
    return safePromise;
  }

  public async preloadScene(sceneName: string): Promise<void> {
    const sceneAssets = Object.values(Assets).filter(a => a.scene === sceneName);
    await Promise.all(sceneAssets.map(a => this.preloadAsset(a)));
  }

  public async preloadCategory(category: AssetCategory): Promise<void> {
    const categoryAssets = Object.values(Assets).filter(a => a.category === category);
    await Promise.all(categoryAssets.map(a => this.preloadAsset(a)));
  }

  public cancelPendingLoads(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.cache.clear();
  }

  public async retryFailedAsset(assetId: string): Promise<void> {
    const asset = Object.values(Assets).find(a => a.id === assetId);
    if (!asset) return;
    
    this.errors.delete(assetId);
    await this.preloadAsset(asset);
  }

  public isLoaded(assetId: string): boolean {
    return this.loaded.has(assetId);
  }

  public isLoading(assetId: string): boolean {
    return this.cache.has(assetId);
  }

  public clearCache(): void {
    this.cancelPendingLoads();
    this.loaded.clear();
    this.errors.clear();
  }

  public getLoadingProgress(): number {
    const total = Object.keys(Assets).length;
    if (total === 0) return 100;
    return Math.round((this.loaded.size / total) * 100);
  }
  
  public getStageProgress(stage: number): number {
    const stageAssets = Object.values(Assets).filter(a => a.preloadStage === stage);
    if (stageAssets.length === 0) return 100;
    const loadedCount = stageAssets.filter(a => this.loaded.has(a.id)).length;
    return Math.round((loadedCount / stageAssets.length) * 100);
  }

  public async preloadStage(stage: number): Promise<void> {
    const stageAssets = Object.values(Assets).filter(a => a.preloadStage === stage);
    await Promise.all(stageAssets.map(a => this.preloadAsset(a)));
  }
}

export const AssetLoader = new AssetLoaderService();
