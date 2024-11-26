import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import Main from './Main.tsx'
import Show from './Show.tsx'
import About from './About.tsx'

const App = () => {
  const location = useLocation();
  const background = location.state && location.state.background;

  return (
    <React.Fragment>
      <Routes location={background ?? location}>
        <Route path="/" element={<Main />} />
        <Route path="/slice" element={<Show />} />
        <Route path="/about" element={<About/>} />
      </Routes>
    </React.Fragment>
  );
}

const Root = () => {
  return (
    <React.StrictMode>
      <BrowserRouter basename="/">
        <App/>
      </BrowserRouter>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
