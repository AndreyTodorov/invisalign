interface Props {
  thresholdMinutes: number
  onDismiss: () => void
}

export default function TimerAlert({ thresholdMinutes, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
        <div className="text-4xl mb-3">⏰</div>
        <h2 className="text-xl font-bold text-red-600 mb-2">Put Your Aligners Back!</h2>
        <p className="text-gray-600 mb-4">
          Your aligners have been out for {thresholdMinutes} minutes.
        </p>
        <button
          onClick={onDismiss}
          className="bg-indigo-500 text-white rounded-xl px-6 py-3 font-semibold w-full"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
