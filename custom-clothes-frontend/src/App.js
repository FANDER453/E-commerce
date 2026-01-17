import {BrowserRouter, Routes, Route} from 'react-router-dom'
import mainPage from "./pages/mainPage";
import loginPage from "./pages/loginPage";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/main" element={mainPage()}></Route>
            <Route path="/login" element={loginPage()}></Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
