import Link from 'next/link'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = '📋',
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-gray-400 text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  )
}
