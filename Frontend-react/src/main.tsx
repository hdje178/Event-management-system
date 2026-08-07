import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {createBrowserRouter, RouterProvider} from "react-router";
import './index.css'
import App from './App.tsx'
import EventsPage from "./Components/EventsPage.tsx";
import LoginPage from "./Components/LoginPage.tsx";

let router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        children: [
            {
                index: true,
                Component: EventsPage,
            },
            {
                path: "login",
                Component: LoginPage
            }
        ]
        //     {
        //         path: "/login",
        //     },
        //     {
        //         path: "/registration",
        //     },
        // ]
    }
])

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
