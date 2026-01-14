import { SidepanesProvider, localStorageAdapter } from '@didmar/react-sidepanes'
import { BasicExample } from './examples/BasicExample'
import './styles/sidepanes.css'

function App() {
  return (
    <SidepanesProvider
      config={{
        persistence: localStorageAdapter
      }}
    >
      <BasicExample />
    </SidepanesProvider>
  )
}

export default App
