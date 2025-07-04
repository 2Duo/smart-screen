import { useEffect } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { useLayoutStore } from './stores/layoutStore'
import { useSocketStore } from './stores/socketStore'
import ClockWidget from './components/widgets/ClockWidget'
import WeatherWidget from './components/widgets/WeatherWidget'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

function App() {
  const { layout, updateLayout } = useLayoutStore()
  const { connect, disconnect } = useSocketStore()

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  const handleLayoutChange = (newLayout: any) => {
    updateLayout(newLayout)
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
      >
        <div key="clock" className="widget-container">
          <ClockWidget />
        </div>
        <div key="weather" className="widget-container">
          <WeatherWidget />
        </div>
      </ResponsiveGridLayout>
    </div>
  )
}

export default App