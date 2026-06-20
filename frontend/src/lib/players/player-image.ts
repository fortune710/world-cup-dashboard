import { logger } from "@/lib/logger"

/** Player photos load through the backend image proxy using the backend image URL. */
const avatarCache = new Map<number | string, string>();

export function getPlayerAvatarUrl(
  imageUrl: string | null | undefined,
  playerId?: number | string
): string | undefined {
  if (playerId && avatarCache.has(playerId)) {
    logger.info("Using cached player avatar URL", { playerId, url: avatarCache.get(playerId) });
    return avatarCache.get(playerId);
  }

  logger.info({
    message: "Building player avatar proxy url",
    image_url: imageUrl ?? null,
    player_id: playerId ?? null,
  })

  let resolvedUrl = imageUrl;
  if (!resolvedUrl && playerId) {
    resolvedUrl = `https://img.sofascore.com/api/v1/player/${playerId}/image`;
    logger.info("Constructed fallback image URL from player ID", { playerId, resolvedUrl });
  }

  if (!resolvedUrl) {
    logger.warn({
      message: "Missing image url while building player avatar proxy url",
      image_url: imageUrl ?? null,
      player_id: playerId ?? null,
    })
    return undefined
  }

  const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(resolvedUrl)}`
  logger.info({
    message: "Built player avatar proxy url",
    image_url: resolvedUrl,
    proxied_url: proxiedUrl,
    player_id: playerId ?? null,
  })

  if (playerId) {
    avatarCache.set(playerId, proxiedUrl);
  }

  return proxiedUrl
}

