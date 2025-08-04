import { motion } from 'framer-motion'
import markdownit from 'markdown-it'
import { Bot, User } from 'lucide-react'
import '../../assets/xterm.css'
import '../../assets/output.css'

const md = markdownit({
  html: true,
  linkify: true,
  typographer: true
})

// Component to render a single chat message
export const ChatMessage = ({ message }) => {
  const isModel = message.role === 'model'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 my-4 ${isModel ? '' : 'justify-end'}`}
    >
      <div
        className={`p-4 rounded-xl max-w-full ${isModel ? 'bg-[#272d36] text-slate-200 order-2' : 'bg-indigo-600 text-white order-1'}`}
      >
        <div
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: md.render(message.parts[0].text) }}
        />
      </div>
    </motion.div>
  )
}
