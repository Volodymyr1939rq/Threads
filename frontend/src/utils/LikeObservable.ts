
type LikeListener = (isLiked: boolean) => void;

class LikeObservable {
  private listeners: Map<string, Set<LikeListener>> = new Map();

  subscribe(postId: string, listener: LikeListener) {
    if (!this.listeners.has(postId)) {
      this.listeners.set(postId, new Set());
    }
    this.listeners.get(postId)?.add(listener);

    return () => {
      this.listeners.get(postId)?.delete(listener);
      if (this.listeners.get(postId)?.size === 0) {
        this.listeners.delete(postId);
      }
    };
  }

  notify(postId: string, isLiked: boolean) {
    this.listeners.get(postId)?.forEach((listener) => listener(isLiked));
  }
}

export const likeObservable = new LikeObservable();