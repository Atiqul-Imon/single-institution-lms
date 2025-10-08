interface StatCardProps {
  name: string
  value: string | number
  icon?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  color?: 'indigo' | 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'orange'
  href?: string
}

export default function StatCard({ 
  name, 
  value, 
  icon, 
  change, 
  changeType = 'neutral',
  color = 'indigo',
  href
}: StatCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500'
  }

  const changeColorClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  const content = (
    <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center shadow-md`}>
              <span className="text-white text-xl font-medium">
                {icon || name.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {name}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-bold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColorClasses[changeType]}`}>
                    {changeType === 'positive' && '↑'}
                    {changeType === 'negative' && '↓'}
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {href && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-indigo-600 hover:text-indigo-500">
              View details →
            </span>
          </div>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }

  return content
}
