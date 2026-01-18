import {BrowserRouter, Routes, Route} from 'react-router-dom'
import mainPage from "./pages/mainPage";
import loginPage from "./pages/loginPage";
import registerPage from "./pages/registerPage";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/main" element={mainPage()}></Route>
            <Route path="/login" element={loginPage()}></Route>
            <Route path="/register" element={registerPage()}></Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
