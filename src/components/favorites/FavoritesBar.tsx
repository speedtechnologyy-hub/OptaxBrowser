import React, { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface FavoritesBarProps {
  favorites: string[]
  favoriteNames?: Record<string, string>
  onNavigate: (url: string) => void
  onOpenFavorites: () => void
  onEditFavorite?: (url: string) => void
  isVisible: boolean
  iconOnly?: boolean
}

const MAX_VISIBLE = 8

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favorites, favoriteNames = {}, onNavigate, onOpenFavorites, onEditFavorite, isVisible, iconOnly = false
}) => {
  const moreRef = useRef<HTMLButtonElement>(null)
  const visible = favorites.slice(0, MAX_VISIBLE)
  const overflow = favorites.slice(MAX_VISIBLE)

  const handleMoreClick = () => {
    if (!moreRef.current || overflow.length === 0) return
    const rect = moreRef.current.getBoundingClientRect()
    const items = overflow.map(fav => {
      let name = fav
      try { name = new URL(fav).hostname.replace('www.', '') } catch {}
      return { url: fav, name: favoriteNames[fav] || name }
    })
    // Use Electron popup window — renders above WebContentsView
    ;(window as any).electronAPI?.showFavPopup(items, Math.round(rect.right), Math.round(rect.bottom))
  }

  const FavItem = ({ fav }: { fav: string }) => {
    let hostname = fav
    try { hostname = new URL(fav).hostname.replace('www.', '') } catch {}
    const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`
    const displayName = favoriteNames[fav] || hostname

    return (
      <button
        onClick={() => onNavigate(fav)}
        onContextMenu={e => {
          e.preventDefault()
          onEditFavorite?.(fav)
        }}
        title={favoriteNames[fav] || fav}
        className={`flex items-center gap-1.5 h-[22px] rounded hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors shrink-0 group
          ${iconOnly ? 'px-1 w-[24px] justify-center' : 'px-2 max-w-[140px]'}`}
      >
        <img
          src={favicon}
          alt=""
          width={iconOnly ? 16 : 14}
          height={iconOnly ? 16 : 14}
          className={`shrink-0 rounded-sm object-contain ${iconOnly ? 'w-4 h-4' : 'w-3.5 h-3.5'}`}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {!iconOnly && (
          <span className="text-[11.5px] text-white/60 group-hover:text-white/90 transition-colors truncate">
            {displayName}
          </span>
        )}
      </button>
    )
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 28, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0"
          style={{ background: '#141416', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="h-full flex items-center px-2 gap-0">
            {/* Folder icon */}
            <button
              onClick={onOpenFavorites}
              className="flex items-center justify-center w-[26px] h-[22px] rounded hover:bg-white/[0.07] transition-colors shrink-0 mr-1"
              title="Gerenciar favoritos"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4C2 3.45 2.45 3 3 3H6.5L8 4.5H13C13.55 4.5 14 4.95 14 5.5V12C14 12.55 13.55 13 13 13H3C2.45 13 2 12.55 2 12V4Z" fill="rgba(255,255,255,0.3)" />
              </svg>
            </button>
            <div className="w-px h-3.5 bg-white/10 mr-2 shrink-0" />

            {favorites.length === 0 ? (
              <span className="text-[11px] text-white/20 px-1 whitespace-nowrap">
                Use a ★ na barra de endereço para adicionar favoritos
              </span>
            ) : (
              <>
                {visible.map(fav => <FavItem key={fav} fav={fav} />)}
                {overflow.length > 0 && (
                  <button
                    ref={moreRef}
                    onClick={handleMoreClick}
                    className="flex items-center px-1.5 h-[22px] rounded hover:bg-white/[0.07] text-[11px] font-bold text-white/35 hover:text-white/70 transition-colors shrink-0 ml-0.5"
                    title={`${overflow.length} favoritos a mais`}
                  >
                    »
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
