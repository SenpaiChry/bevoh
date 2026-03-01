import React, { useEffect, useState } from "react"
import { StarRating } from "./StarRating"
import { Button } from "@/components/ui/button"

function clampRating(n: number) {
  const x = Number.isFinite(n) ? n : 0
  return Math.max(0, Math.min(5, x))
}

export const EditReviewModal: React.FunctionComponent<{
  open: boolean
  loading?: boolean
  error?: string | null

  initialText: string
  initialRating: number

  onCancel: () => void
  onConfirm: (payload: { text: string; rating: number }) => void
}> = (props) => {
  const [text, setText] = useState(props.initialText ?? "")
  const [rating, setRating] = useState<number>(clampRating(props.initialRating ?? 0))

  // quando apri/ cambi target → reset campi
  useEffect(() => {
    if (!open) return
    setText(props.initialText ?? "")
    setRating(clampRating(props.initialRating ?? 0))
  }, [open, props.initialText, props.initialRating])

  if (!open) return null

  const canSave = text.trim().length > 0 && !props.loading

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-5 w-full max-w-md border border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground mb-1">Edit review</h3>
        <p className="text-sm text-foreground-muted mb-4">
          Update your review text and rating.
        </p>

        {/* Textarea */}
        <div className="space-y-2">
          <label className="text-xs text-foreground-muted">Your review</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full bg-background rounded-xl px-3 py-2 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Write your review..."
            disabled={props.loading}
          />
        </div>

        {/* Rating */}
        <div className="mt-4 flex justify-center">
          <StarRating value={rating} onChange={setRating} />
        </div>

        {props.error ? <p className="mt-3 text-sm text-red-400">{props.error}</p> : null}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={props.onCancel}
            disabled={props.loading}
            className="flex-1 bg-white/10 hover:bg-white/15 rounded-xl py-2 text-foreground transition"
          >
            Cancel
          </button>

          <Button
            className="flex-1 rounded-xl"
            disabled={!canSave}
            onClick={() => props.onConfirm({ text: text.trim(), rating: clampRating(rating) })}
          >
            {props.loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
