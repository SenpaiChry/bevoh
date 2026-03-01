import { Star } from "lucide-react"

type StarRatingProps = {
  value: number
  onChange?: (v: number) => void
  size?: number
  className?: string
  gapClassName?: string // es: "gap-0.5 sm:gap-1"
}

export function StarRating({
  value,
  onChange,
  size = 24,
  className,
  gapClassName = "gap-1",
}: StarRatingProps) {
  return (
    <div className={["flex items-center", gapClassName, className].filter(Boolean).join(" ")}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isFull = value >= i
        const isHalf = value === i - 0.5

        return (
          <button
            key={i}
            type="button"
            className="relative p-0 shrink-0"
            onClick={() => {
              if (!onChange) return
              onChange(value === i ? i - 0.5 : i)
            }}
            aria-label={`Set rating ${value === i ? i - 0.5 : i}`}
          >
            {/* base */}
            <Star width={size} height={size} className="text-muted" />

            {/* half */}
            {isHalf && (
              <Star
                width={size}
                height={size}
                className="fill-yellow-400 text-yellow-400 absolute top-0 left-0"
                style={{ clipPath: "inset(0 50% 0 0)" }}
              />
            )}

            {/* full */}
            {isFull && (
              <Star
                width={size}
                height={size}
                className="fill-yellow-400 text-yellow-400 absolute top-0 left-0"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
