import { X } from "lucide-react"
import React, { useEffect, useState } from "react"

export const EditLogModal: React.FunctionComponent<{
    open: boolean
    loading: boolean
    error: string | null
    initialQuantity: number
    initialDateYYYYMMDD: string
    initialTimeHHmm: string
    initialNotes: string
    onCancel: () => void
    onConfirm: (payload: { quantity: number; dateYYYYMMDD: string; timeHHmm: string; notes: string }) => void
}> = (props) => {

    const [qty, setQty] = useState(String(props.initialQuantity ?? 1))
    const [date, setDate] = useState(props.initialDateYYYYMMDD || "")
    const [time, setTime] = useState(props.initialTimeHHmm || "00:00")
    const [notes, setNotes] = useState(props.initialNotes ?? "")

    useEffect(() => {
        if (!open) return
        setQty(String(props.initialQuantity ?? 1))
        setDate(props.initialDateYYYYMMDD || "")
        setTime(props.initialTimeHHmm || "00:00")
        setNotes(props.initialNotes ?? "")
    }, [open, props.initialQuantity, props.initialDateYYYYMMDD, props.initialTimeHHmm, props.initialNotes])

    if (!open) return null

    const parsedQty = Math.max(1, Number(qty || 1))
    const canSave = Number.isFinite(parsedQty) && parsedQty > 0 && !!date

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
            <div className="bg-card rounded-2xl p-4 w-full max-w-md">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground">Edit log</h3>
                    <button onClick={props.onCancel} disabled={props.loading} className="text-foreground-muted">
                        <X />
                    </button>
                </div>

                {props.error && <p className="text-xs text-red-400 mb-2">{props.error}</p>}

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-foreground-muted">Quantity</label>
                        <input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)}
                            className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-foreground-muted">Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                                className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none" />
                        </div>

                        <div>
                            <label className="text-xs text-foreground-muted">Time</label>
                            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                                className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-foreground-muted">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                            className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none resize-none"
                            placeholder="Optional..." />
                    </div>
                </div>

                <div className="flex gap-3 mt-5">
                    <button type="button" onClick={props.onCancel} disabled={props.loading}
                        className="flex-1 bg-white/10 rounded-xl py-2 text-foreground">
                        Cancel
                    </button>

                    <button type="button"
                        onClick={() => props.onConfirm({ quantity: parsedQty, dateYYYYMMDD: date, timeHHmm: time, notes })}
                        disabled={props.loading || !canSave}
                        className="flex-1 bg-primary rounded-xl py-2 text-background font-medium disabled:opacity-50">
                        {props.loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    )
}