import {BrowserRouter, Routes, Route} from 'react-router-dom'
import MainPage from "./pages/mainPage";
import LoginPage from "./pages/loginPage";
import RegisterPage from "./pages/registerPage";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/main" element={MainPage()}></Route>
            <Route path="/login" element={LoginPage()}></Route>
            <Route path="/register" element={RegisterPage()}></Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
