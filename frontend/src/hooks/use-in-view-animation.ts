import * as React from "react"

/**
 * Tracks whether an element has scrolled into the viewport, so entrance
 * animations (chart draw-in, progress bar fill, etc.) only start once the
 * card is actually visible instead of firing off-screen on page load.
 * Triggers once and stays active; respects prefers-reduced-motion.
 *
 * Uses a callback ref (not useRef + useEffect) so it works correctly even
 * when the ref'd element only appears after an earlier conditional render
 * (e.g. a loading state) -- a plain useEffect can run while the node is
 * still null and never get another chance to attach the observer.
 */
export function useInViewAnimation<T extends Element = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const reduceMotion = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  )
  const [active, setActive] = React.useState(reduceMotion)
  const activeRef = React.useRef(active)
  activeRef.current = active
  const observerRef = React.useRef<IntersectionObserver | null>(null)

  const ref = React.useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null

      if (!node || activeRef.current || reduceMotion) return

      if (typeof IntersectionObserver === "undefined") {
        setActive(true)
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActive(true)
            observer.disconnect()
          }
        },
        { threshold: 0.2, ...options }
      )
      observer.observe(node)
      observerRef.current = observer
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduceMotion]
  )

  React.useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  return { ref, active, reduceMotion }
}
