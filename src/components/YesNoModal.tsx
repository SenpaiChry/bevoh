export const YesNoModal: React.FunctionComponent<{
    title: string,
    description: string,
    open: boolean,
    loading?: boolean,
    error?: string | null,
    onCancel: () => void,
    onConfirm: () => void
}> = (props) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl p-5 w-full max-w-sm border border-white/10 shadow-xl animate-in fade-in zoom-in-95">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    {props.title}
                </h3>

                <p className="text-sm text-foreground-muted mb-4">
                    {props.description}
                </p>

                {props.error && (<p className="text-sm text-red-400 mb-3">{props.error}</p>)}

                <div className="flex gap-3">
                    <button onClick={props.onCancel} disabled={props.loading}
                        className="flex-1 bg-white/10 hover:bg-white/15 rounded-xl py-2 text-foreground transition">
                        Cancel
                    </button>

                    <button onClick={props.onConfirm} disabled={props.loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 rounded-xl py-2 text-white font-medium transition">
                        {props.loading ? "Confirming..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    )
}
