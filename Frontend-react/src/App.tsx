import './App.css'
import {Outlet} from "react-router";
import Header from "./Components/Header";

function App() {
  return (
      <>
          <Header></Header>
          <Outlet></Outlet>
      </>
  )
}

export default App
