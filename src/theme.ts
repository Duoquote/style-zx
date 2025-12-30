import { createTheme } from "./style-zx"

export const theme = createTheme({
    colors: {
        primary: "#646cff",
        secondary: "#40db55ff",
        background: "#ffffff",
        text: "#213547",
        surface: "#f9f9f9",
    },
    spacing: {
        small: "8px",
        medium: "16px",
        large: "24px",
    },
    dark: {
        colors: {
            primary: "#646cff",
            secondary: "#535bf2",
            background: "#242424",
            text: "rgba(255, 255, 255, 0.87)",
            surface: "#1a1a1a",
        }
    }
})
