"""Rate limiting middleware for API endpoints."""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """In-memory rate limiter using sliding window algorithm.
    
    Tracks requests per user/IP and enforces configurable limits.
    Suitable for single Lambda instance. For distributed rate limiting,
    use DynamoDB or Redis.
    """
    
    def __init__(self):
        # Storage: {key: [(timestamp, count)]}
        self._requests: Dict[str, List[Tuple[datetime, int]]] = {}
        
    def _cleanup_old_requests(self, key: str, window_seconds: int) -> None:
        """Remove requests outside the current window."""
        if key not in self._requests:
            return
            
        cutoff = datetime.utcnow() - timedelta(seconds=window_seconds)
        self._requests[key] = [
            (ts, count) for ts, count in self._requests[key]
            if ts > cutoff
        ]
        
    def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int, int]:
        """Check if request is within rate limit.
        
        Args:
            key: Unique identifier (user_id, IP, etc.)
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            
        Returns:
            Tuple of (allowed, current_count, retry_after_seconds)
        """
        self._cleanup_old_requests(key, window_seconds)
        
        if key not in self._requests:
            self._requests[key] = []
        
        current_count = sum(count for _, count in self._requests[key])
        
        if current_count >= max_requests:
            # Find oldest request to calculate retry-after
            if self._requests[key]:
                oldest_ts = min(ts for ts, _ in self._requests[key])
                retry_after = int((oldest_ts + timedelta(seconds=window_seconds) - datetime.utcnow()).total_seconds())
                retry_after = max(1, retry_after)  # At least 1 second
            else:
                retry_after = window_seconds
                
            logger.warning(f"Rate limit exceeded for key: {key} ({current_count}/{max_requests})")
            return False, current_count, retry_after
        
        # Record this request
        self._requests[key].append((datetime.utcnow(), 1))
        logger.debug(f"Rate limit check passed for key: {key} ({current_count + 1}/{max_requests})")
        
        return True, current_count + 1, 0
    
    def reset(self, key: str) -> None:
        """Reset rate limit for a key (useful for testing)."""
        if key in self._requests:
            del self._requests[key]


# Global instance (shared across requests in the same Lambda instance)
rate_limiter = RateLimiter()


# Rate limit configurations
RATE_LIMITS = {
    "search_users": {"requests": 10, "window_seconds": 60},
    "add_friend": {"requests": 5, "window_seconds": 60},
    "remove_friend": {"requests": 5, "window_seconds": 60},
    "list_friends": {"requests": 30, "window_seconds": 60},
}


def get_rate_limiter() -> RateLimiter:
    """Dependency injection for rate limiter."""
    return rate_limiter
