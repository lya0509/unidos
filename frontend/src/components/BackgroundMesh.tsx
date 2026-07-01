import { useTheme } from '../context/ThemeContext'

export const BackgroundMesh = () => {
  const { theme } = useTheme()

  if (theme === 'battery-saver') {
    return <div className="fixed inset-0 bg-black pointer-events-none z-[-1]" />
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] transition-colors duration-500">
      {theme === 'dark' ? (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-yellow-500/15 blur-[100px]" />
          <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-red-600/15 blur-[130px]" />
          {/* Tech Grid Overlay Dark */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
        </>
      ) : (
        <>
          {/* Soft, beautiful pastel patriotic spheres for light mode */}
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#FCE300]/40 blur-[90px] mix-blend-multiply" />
          <div className="absolute top-[30%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#0038A8]/20 blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[10%] w-[80vw] h-[80vw] rounded-full bg-[#CE1126]/20 blur-[110px] mix-blend-multiply" />
          {/* Tech Grid Overlay Light */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,white,transparent)]" />
        </>
      )}
    </div>
  )
}
