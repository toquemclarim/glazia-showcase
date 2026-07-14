import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

export function LoadingScreen() {
  const { loading } = useApp()

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <img src="/logo.png" alt="Glazia" className="loading-logo" />
          <div className="loading-bar">
            <span />
          </div>
          <p className="loading-text">Carregando</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
