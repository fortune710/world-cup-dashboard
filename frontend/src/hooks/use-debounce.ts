import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    logger.debug("Setting debounce timer", { value, delay });
    const timer = setTimeout(() => {
      logger.info("Debounced value updated", { value });
      setDebounced(value);
    }, delay);
    return () => {
      logger.debug("Clearing debounce timer", { value });
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}
