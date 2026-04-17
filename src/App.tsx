import { authClient } from "./lib/auth-client";
import { AuthProvider } from "./context/AuthContext";
import { Board } from "./components/Board";
import { LoginPage } from "./components/LoginPage";
import "./App.css";

function AppContent() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;
  return session ? <Board /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
