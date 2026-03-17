import { useSessions } from '../../hooks/useSessions'
import { sessionsToCSV, downloadCSV } from '../../utils/csv'

export default function ExportButton() {
  const { sessions } = useSessions()

  const handleExport = () => {
    const csv = sessionsToCSV(sessions)
    downloadCSV(csv, `aligner-sessions-${new Date().toLocaleDateString('sv')}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold text-sm"
    >
      Export Sessions as CSV
    </button>
  )
}
