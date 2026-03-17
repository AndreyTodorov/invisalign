interface Props {
  isRunning: boolean
  onPress: () => void
  disabled?: boolean
}

export default function TimerButton({ isRunning, onPress, disabled }: Props) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={`
        w-40 h-40 rounded-full text-white font-bold shadow-lg
        active:scale-95 transition-transform disabled:opacity-50
        ${isRunning
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-indigo-500 hover:bg-indigo-600'
        }
      `}
    >
      {isRunning ? (
        <span className="text-lg">PUT BACK</span>
      ) : (
        // FIX LG-3: whitespace-pre-line renders the \n as an actual line break
        <span className="whitespace-pre-line text-base leading-tight">
          {'REMOVE\nALIGNERS'}
        </span>
      )}
    </button>
  )
}
