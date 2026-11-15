import { ConfigProvider } from 'antd'
import itIT from 'antd/locale/it_IT'
import ReactDOM from 'react-dom/client'
import App from './App'
import theme from './basic-ui/theme'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={itIT} theme={theme}>
    <App />
  </ConfigProvider>,
)
