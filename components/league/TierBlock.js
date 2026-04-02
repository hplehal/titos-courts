import { cn, getTierColor, getMovementIcon } from '@/lib/utils'

export default function TierBlock({ tier, teams = [], matches = [], showMovement = false }) {
  const { tierNumber, courtNumber, timeSlot } = tier
  const color = getTierColor(tierNumber)

  const positionLabels = ['1st', '2nd', '3rd']

  return (
    <div className="card overflow-hidden">
      {/* Tier header */}
      <div className={cn('px-5 py-3 border-b border-titos-border/50 flex items-center justify-between', color.bg)}>
        <div className="flex items-center gap-3">
          <span className={cn('font-display font-bold text-lg', color.text)}>
            Tier {tierNumber}
          </span>
          {courtNumber && (
            <span className="text-titos-gray-400 text-sm">
              Court {courtNumber}
            </span>
          )}
        </div>
        {timeSlot && (
          <span className="text-titos-gray-300 text-sm font-medium">{timeSlot}</span>
        )}
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <div className="px-5 py-3 border-b border-titos-border/30">
          <div className="space-y-2">
            {teams.map((team, i) => (
              <div key={team.id || team.name || i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                      i === 0
                        ? 'bg-titos-gold/20 text-titos-gold'
                        : i === 1
                          ? 'bg-titos-gray-500/20 text-titos-gray-300'
                          : 'bg-titos-gray-600/20 text-titos-gray-400'
                    )}
                  >
                    {positionLabels[i] || i + 1}
                  </span>
                  <span className="text-titos-white text-sm font-medium">{team.name}</span>
                </div>
                {showMovement && team.movement && (
                  <span
                    className={cn(
                      'text-sm font-bold',
                      team.movement === 'up' && 'movement-up',
                      team.movement === 'down' && 'movement-down',
                      team.movement === 'stay' && 'movement-stay'
                    )}
                  >
                    {getMovementIcon(team.movement)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div className="px-5 py-3">
          <div className="space-y-2">
            {matches.map((match, i) => (
              <div
                key={match.id || i}
                className="flex items-center justify-between text-sm py-1.5 border-b border-titos-border/20 last:border-0"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-titos-white font-medium truncate">{match.homeTeam}</span>
                  <span className="text-titos-gray-500 flex-shrink-0">vs</span>
                  <span className="text-titos-white font-medium truncate">{match.awayTeam}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  {match.scores && (
                    <span className="text-titos-gold font-bold text-xs">
                      {match.scores}
                    </span>
                  )}
                  {match.refTeam && (
                    <span className="text-titos-gray-500 text-xs">
                      Ref: {match.refTeam}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
