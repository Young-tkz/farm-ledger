import { prisma } from '@/lib/prisma'

// This forces the page to refresh data every time you load it
export const dynamic = 'force-dynamic'

export default async function Home() {
  // 1. Fetch data from your database (newest first)
  const entries = await prisma.entry.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true } // Get the name of the person too
  })

  // 2. Simple calculation for the top card
  const totalEntries = entries.length

  return (
      <main className="min-h-screen bg-gray-50 p-6 font-sans">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-800">🚜 Farm Ledger</h1>
            <p className="text-gray-600">Family Expense Tracker</p>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            🟢 Live Connected
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total Entries</h3>
            <p className="text-3xl font-bold text-gray-800">{totalEntries}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Last Update</h3>
            <p className="text-lg font-semibold text-green-600">
              {entries[0] ? new Date(entries[0].createdAt).toLocaleTimeString() : 'Waiting...'}
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 className="text-blue-600 text-sm font-medium">AI Status</h3>
            <p className="text-lg font-semibold text-blue-900">Active 🤖</p>
          </div>
        </div>

        {/* The Data Table */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {entry.user.name}
                    </span>
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-medium">
                      {entry.content}
                    </td>
                    <td className="p-4">
                      {/* Logic to show different colors based on AI tags */}
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                          (entry.content || '').includes('[EXPENSE]') ? 'bg-red-100 text-red-700' :
                              (entry.content || '').includes('[INCOME]') ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-600'
                      }`}>
                      {(entry.content || '').includes('[')
                          ? (entry.content || '').split(']')[0].replace('[','')
                          : 'LOG'}
                    </span>
                    </td>
                  </tr>
              ))}
              {entries.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-gray-500">
                      No data yet. Send a message on WhatsApp to see it appear here!
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
  )
}